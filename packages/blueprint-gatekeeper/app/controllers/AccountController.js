var blueprint = require ('@onehilltech/blueprint')
  , gatekeeper = require ('../../lib')
  , async = require ('async')
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
  ResourceController.call (this, {model: Account, id: 'accountId'});
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

      postExecute: function (account, callback) {
        bm.emit ('gatekeeper.account.created', account);
        return callback (null, account);
      }
    }
  };

  return ResourceController.prototype.create.call (this, options);
};

/**
 * Get the account profile.
 *
 * @param callback
 * @returns {Function}
 */
AccountController.prototype.getProfile = function () {
  var self = this;

  return function (req, res) {
    var accountId = req.accountId;

    Account.findById (accountId, '_id profile', function (err, account) {
      if (err)
        return self.handleError (null, res, 404, 'Account does not exist');

      var profile = account.profile.toObject ();
      profile['_id'] = accountId;

      res.status (200).json (profile);
    });
  };
};

/**
 * Delete an existing account.
 *
 * @param callback
 * @returns {Function}
 */
AccountController.prototype.deleteAccount = function (callback) {
  var self = this;

  return function (req, res) {
    var accountId = req.accountId;

    Account.remove ({_id : accountId}, function (err) {
      if (err)
        return self.handleError (err, res, 404, 'Failed to delete account', callback);

      // Notify listeners that an account has been deleted.
      bm.emit ('gatekeeper.account.deleted', accountId);

      return res.status (200).json (true);
    });
  };
};

/**
 * Enable/disable an account.
 *
 * @param callback
 * @returns {Function}
 */
AccountController.prototype.enableAccount = function (callback) {
  var self = this;

  return function (req, res) {
    req.checkBody ('enabled', 'enabled is a required Boolean').notEmpty ().isBoolean ();

    var errors = req.validationErrors ();

    if (errors)
      return self.handleError (null, res, 400, errros, callback);

    // Sanitize the parameters.
    req.sanitizeBody ('enabled').toBoolean ();

    var accountId = req.accountId;
    var enabled = req.body.enabled;

    var update = {
      $set : {
        enabled : enabled
      }
    };

    Account.findByIdAndUpdate (accountId, update, function (err) {
      if (err)
        return self.handleError (err, res, 500, 'Failed to enable/disable account', callback);

      // Notify listeners that an account has been disabled.
      bm.emit ('gatekeeper.account.enabled', accountId, enabled);

      res.status (200).json (true);
    });
  };
};

/**
 * Update the roles for an account.
 *
 * @param callback
 * @returns {Function}
 */
AccountController.prototype.updateRoles = function (callback) {
  var self = this;

  var ops = {
    add : function (roles) {
      return {
        $addToSet : {
          roles : roles
        }
      }
    },
    remove : function (roles) {
      return {
        $pull : {
          roles : { $in : roles }
        }
      }
    }
  };

  return function (req, res) {
    var accountId = req.accountId;
    var op = req.body.operation;
    var roles = req.body.roles;
    var update = ops[op] (roles);

    Account.findByIdAndUpdate (accountId, update, function (err) {
      if (err)
        return self.handleError (err, res, 500, 'failed to update roles', callback);

      res.status (200).json (true);
    });
  };
};

module.exports = exports = AccountController;
