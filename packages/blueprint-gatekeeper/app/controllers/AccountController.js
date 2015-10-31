var winston   = require ('winston')
  , blueprint = require ('@onehilltech/blueprint')
  ;

var Account = require ('../models/Account')
  , Client  = require ('../models/Client')
  ;

function AccountController () {

}

blueprint.controller (AccountController);

/**
 * Test if the current user is an administrator.
 *
 * @param res
 * @param res
 */
AccountController.prototype.isAdmin = function (user) {
  return user.roles.indexOf ('admin') !== -1;
};

/**
 * Test if the current request has access to the account, or the user that
 * made the request is an admin.
 *
 * @param req
 * @param res
 */
AccountController.prototype.hasAccessToAccount = function (user, account) {
  return user._id.equals (account._id) || this.isAdmin (user);
};

/**
 * Get a list of the accounts in the database.
 *
 * @param callback
 * @returns {Function}
 */
AccountController.prototype.getAccounts = function (callback) {
  var self = this;

  return function (req, res) {
    Account.find ({}, '-__v -apn', function (err, accounts) {
      if (err)
        return self.handleError (err, res, 500, 'Cannot get requested account', callback);

      return res.status (200).json (accounts);
    });
  };
};

/**
 * Create a new account, and store the new account in the database.
 *
 * @param callback
 * @returns {Function}
 */
AccountController.prototype.createAccount = function (callback) {
  var self = this;

  return function (req, res) {
    // Make sure the client has the account.create role. Otherwise, the client
    // does not have the correct privileges.
    var client = req.user;

    if (-1 === client.roles.indexOf ('account.create'))
      return self.handleError (null, res, 401, 'Client cannot create accounts', callback);

    // Create the new account, and include the client that created the account.
    var account = new Account ({
      username : req.body.username,
      password : req.body.password,
      email : req.body.email,
      created_by : client
    });

    account.save (function (err, account) {
      if (err)
        return self.handleError (err, res, 500, 'Failed to create account', callback);

      // Notify listeners that an account has been created.
      blueprint.emit ('gatekeeper.account.created', account);

      return res.status (200).json (true);
    });
  };
};

/**
 * Get the account
 *
 * @param callback
 * @returns {Function}
 */
AccountController.prototype.getAccount = function (callback) {
  var self = this;

  return function (req, res) {
    Account.findById (req.accountId, function (err, account) {
      if (err)
        return self.handleError (null, res, 404, 'account does not exist', callback);

      res.status (200).json (account.toObject ())
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
      blueprint.emit ('gatekeeper.account.deleted', accountId);

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
      blueprint.emit ('gatekeeper.account.enabled', accountId, enabled);

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
