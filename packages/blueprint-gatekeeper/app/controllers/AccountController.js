var blueprint  = require ('@onehilltech/blueprint')
  , messaging  = blueprint.messaging
  , gatekeeper = require ('../../lib')
  ;

var Account = require ('../models/Account')
  , Client  = require ('../models/Client')
  ;


var ResourceController = blueprint.ResourceController
  , Policy = blueprint.Policy
  ;

var DEFAULT_ACCOUNT_PROJECTION_EXCLUSIVE = {
  'access_credentials.password': 0,
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
        Policy (
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
        Policy (
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
        Policy (
          Policy.and ([
            Policy.assert ('is_client_request'),
            Policy.assert ('has_role', gatekeeper.roles.client.account.create)
          ])
        ).evaluate (req, callback);
      },

      preCreate: function (req, doc, callback) {
        // Overwrite the current document with one that matches the
        // data model for an account.

        doc = {
          access_credentials : {username : req.body.username, password : req.body.password},
          profile: {email : req.body.email},
          internal_use: { created_by : req.user }
        };

        return callback (null, doc);
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
        Policy (
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
