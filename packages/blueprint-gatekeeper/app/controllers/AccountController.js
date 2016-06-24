var blueprint  = require ('@onehilltech/blueprint')
  , gatekeeper = require ('../../lib')
  , async      = require ('async')
  ;

var Account = require ('../models/Account')
  , Client  = require ('../models/Client')
  ;


var bm = blueprint.messaging
  , ResourceController = blueprint.ResourceController
  ;

var DEFAULT_ACCOUNT_PROJECTION_EXCLUSIVE = {
  'access_credentials.password': 0,
  '__v': 0
};

/**
 * Check that the request is from a client.
 *
 * @param req
 * @param callback
 * @returns {*}
 */
function isClient (req, callback) {
  return callback (null, req.user.collection.collectionName === Client.collection.collectionName);
}

function isOwner (req, callback) {
  return callback (null, req.accountId === req.user.id);
}

/**
 * Check that user has the correct roles.
 *
 * @param expected
 * @param req
 * @param callback
 */
function hasRole (expected, req, callback) {
  var current = req.user.getRoles ();

  async.some (expected, function (expectedRole, callback) {
    async.some (current, function (currentRole, callback) {
      return callback (currentRole === expectedRole);
    }, callback);
  }, function (result) {
    return callback (null, result);
  });
}

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
        ResourceController.runChecks ([
          ResourceController.check (hasRole, [gatekeeper.roles.user.administrator])
        ], req, callback);
      },

      prepareProjection: function (req, callback) {
        callback (null, DEFAULT_ACCOUNT_PROJECTION_EXCLUSIVE);
      }
    }
  };

  return ResourceController.prototype.getAll.call (this, options);
};

/**
 * Get the account
 *
 * @param callback
 * @returns {Function}
 */
AccountController.prototype.get = function () {
  var options = {
    on: {
      authorize: function (req, callback) {
        ResourceController.runChecks ([
          ResourceController.orCheck ([
            ResourceController.check (isOwner),
            ResourceController.check (hasRole, [gatekeeper.roles.user.administrator])
          ])
        ], req, callback);
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
        ResourceController.runChecks ([
          ResourceController.check (isClient),
          ResourceController.check (hasRole, [gatekeeper.roles.client.account.create])
        ], req, callback);
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
        bm.emit ('gatekeeper.account.created', account);
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
        ResourceController.runChecks ([
          ResourceController.orCheck ([
            ResourceController.check (isOwner),
            ResourceController.check (gatekeeper.authorization.checks.isAdministrator)
          ])
        ], req, callback);
      },

      postExecute: function (req, account, callback) {
        bm.emit ('gatekeeper.account.deleted', account);
        return callback (null, true);
      }
    }
  };

  return ResourceController.prototype.delete.call (this, options);
};

module.exports = exports = AccountController;
