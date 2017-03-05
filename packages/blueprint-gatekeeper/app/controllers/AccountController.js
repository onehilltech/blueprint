'use strict';

var blueprint  = require ('@onehilltech/blueprint')
  , mongodb    = require ('@onehilltech/blueprint-mongodb')
  , messaging  = blueprint.messaging
  , uid        = require ('uid-safe')
  , async      = require ('async')
  , gatekeeper = require ('../../lib')
  ;

var Account = require ('../models/Account')
  ;

var ResourceController = mongodb.ResourceController
  , Policy = blueprint.Policy
  ;

var gatekeeperConfig;
var tokenStrategy;

const DEFAULT_ACTIVATION_REQUIRED = false;

var activationConfig;

messaging.on ('app.init', function (app) {
  gatekeeperConfig = app.configs.gatekeeper;
  activationConfig = gatekeeperConfig.activation || {};

  tokenStrategy = gatekeeper.tokens (gatekeeperConfig.token);
});

function AccountController () {
  ResourceController.call (this, {model: Account, eventPrefix: 'gatekeeper'});
}

blueprint.controller (AccountController, ResourceController);

/**
 * Create a new account.
 *
 * @returns {*}
 */
AccountController.prototype.create = function () {
  var options = {
    on: {
      prepareDocument: function (req, doc, callback) {
        // Overwrite the current document with one that matches the
        // data model for an account.
        var required = activationConfig.required;

        if (required === undefined)
          required = DEFAULT_ACTIVATION_REQUIRED;

        doc = {
          email : req.body.account.email,
          username : req.body.account.username,
          password : req.body.account.password,
          created_by : req.user,
          activation: {
            required: required
          }
        };

        if (req.body.account.scope)
          doc.scope = req.body.account.scope;

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
        return callback (null, {_id: account._id});
      }
    }
  };

  return ResourceController.prototype.create.call (this, options);
};

/**
 * Delete an account in the database
 */
AccountController.prototype.update = function () {
  var options = {
    on: {
      /**
       * Prepare the update document. Depending on the scope of the request, certain
       * fields can and cannot be updated.
       *
       * @param req
       * @param doc
       * @param callback
       * @returns {*}
       */
      prepareUpdate: function (req, doc, callback) {
        // This is permanent field that can never be updated.
        if (doc.$set.created_by)
          delete doc.$set.created_by;

        // Only the superuser can update the scope.
        if (doc.$set.scope && req.authInfo.scope.indexOf (gatekeeper.scope.superuser) === -1)
          delete doc.$set.scope;

        return callback (null, doc);
      }
    }
  };

  return ResourceController.prototype.update.call (this, options);
};

module.exports = AccountController;
