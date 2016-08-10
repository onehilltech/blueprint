var blueprint  = require ('@onehilltech/blueprint')
  , messaging  = blueprint.messaging
  , uid        = require ('uid-safe')
  , async      = require ('async')
  , gatekeeper = require ('../../lib')
  ;

var Account = require ('../models/Account')
  , Client  = require ('../models/Client')
  ;

var ResourceController = blueprint.ResourceController
  , Policy = blueprint.Policy
  ;

var gatekeeperConfig;
var tokenStrategy;

const DEFAULT_ACTIVATION_REQUIRED = false;

var activationConfig;

messaging.once ('app.init', function (app) {
  gatekeeperConfig = app.configs.gatekeeper;
  activationConfig = gatekeeperConfig.activation || {};

  tokenStrategy = gatekeeper.tokens (gatekeeperConfig.token);
});

var DEFAULT_ACCOUNT_PROJECTION_EXCLUSIVE = {
  'password': 0,
  '__v': 0
};

function AccountController () {
  ResourceController.call (this, {name: 'account', model: Account, id: 'accountId'});
}

blueprint.controller (AccountController, ResourceController);

/**
 * Get all the accounts in the database. Only administrators can access all the accounts
 * in the database.
 */
AccountController.prototype.getAll = function () {
  var options = {
    on: {
      authorize: function (req, callback) {
        Policy.Definition (
          Policy.assert ('is_administrator')
        ).evaluate (req, callback);
      },

      prepareProjection: function (req, callback) {
        callback (null, DEFAULT_ACCOUNT_PROJECTION_EXCLUSIVE);
      }
    }
  };

  return ResourceController.prototype.getAll.call (this, options);
};

/**
 * Get a single account from the database.
 *
 * @returns {Function}
 */
AccountController.prototype.get = function () {
  var options = {
    on: {
      authorize: function (req, callback) {
        Policy.Definition (
          Policy.or ([
            Policy.assert ('is_account_owner'),
            Policy.assert ('is_administrator')
          ])
        ).evaluate (req, callback);
      },

      prepareProjection: function (req, callback) {
        callback (null, DEFAULT_ACCOUNT_PROJECTION_EXCLUSIVE);
      }
    }
  };

  return ResourceController.prototype.get.call (this, options);
};

/**
 * Create a new account in the database.
 *
 * @returns {*|Object}
 */
AccountController.prototype.create = function () {
  var options = {
    on: {
      authorize: function (req, callback) {
        async.series ([
          function (callback) {
            Policy.Definition (
              Policy.and ([
                Policy.assert ('is_client_request'),
                Policy.assert ('has_role', gatekeeper.roles.client.account.create)
              ])
            ).evaluate (req, callback);
          },
          function (callback) {
            // Validate the input parameters.
            req.checkBody ('email', 'Missing/invalid email').notEmpty ().isEmail ();
            req.checkBody ('username', 'Missing/invalid username').notEmpty ();
            req.checkBody ('password', 'Missing/invalid password').notEmpty ();

            return callback (req.validationErrors (true));
          }
        ], callback);
      },

      preCreate: function (req, doc, callback) {
        // Overwrite the current document with one that matches the
        // data model for an account.
        var required = activationConfig.required;

        if (required === undefined)
          required = DEFAULT_ACTIVATION_REQUIRED;

        doc = {
          email : req.body.email,
          username : req.body.username,
          password : req.body.password,
          created_by : req.user ,
          activation: {
            required: required
          }
        };

        async.waterfall ([
          function (callback) {
            if (!doc.activation.required)
              return callback (null);

            var opts = {
              payload: {email: doc.email, username: doc.username},
              options: {
                expiresIn: gatekeeperConfig.activation.expiresIn
              }
            };

            tokenStrategy.generateToken (opts, callback);
          }
        ], function (err, token) {
          if (err) return callback (err);
          if (token) doc.activation.token = token;

          return callback (null, doc);
        });
      },

      postExecute: function (req, account, callback) {
        messaging.emit ('gatekeeper.account.created', account);

        return callback (null, {_id: account._id});
      }
    }
  };

  return ResourceController.prototype.create.call (this, options);
};

/**
 * Delete an account in the database
 *
 * @returns {*|Object}
 */
AccountController.prototype.delete = function () {
  var options = {
    on: {
      authorize: function (req, callback) {
        Policy.Definition (
          Policy.or ([
            Policy.assert ('is_account_owner'),
            Policy.assert ('is_administrator')
          ])
        ).evaluate (req, callback);
      },

      postExecute: function (req, account, callback) {
        messaging.emit ('gatekeeper.account.deleted', account);
        return callback (null, true);
      }
    }
  };

  return ResourceController.prototype.delete.call (this, options);
};

module.exports = exports = AccountController;
