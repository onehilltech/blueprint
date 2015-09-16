var winston   = require ('winston')
  , blueprint = require ('blueprint')
  ;

var Account = require ('../models/Account')
  , Client  = require ('../models/Client')
  ;

function AccountController () {

}

blueprint.controller (AccountController);

AccountController.prototype.lookupAccountByParam = function (callback) {
  return function (req, res, next, accountId) {
    winston.log ('info', 'lookup account: %s', accountId);

    Account.findById (accountId, function (err, account) {
      if (err)
        return next (err);

      if (!account)
        return next (new Error ('account does not exist'));

      req.account = account;
      return next ();
    });
  };
};

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
    Account.find ({}, '-__v', function (err, accounts) {
      if (err)
        return self.handleError (err, res, 500, 'cannot get requested account', callback);

      return res.status (200).send (accounts.toObject ());
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
    // Check that the client has the create_account role. If the client does not have
    // this role, then we return an error.
    var clientId = req.body.client_id;
    var criteria = {_id: clientId, roles: {'$in': ['create_account']}};

    Client.findOne (criteria, function (err, client) {
      if (err)
        return self.handleError (err, res, 500, 'failed to validate client', callback);

      if (!client)
        return self.handleError (err, res, 401, 'client cannot create accounts', callback);

      // Create the new account, and include the client that created the account.
      var account = new self._model ({
        username : req.body.username,
        password : req.body.password,
        email    : req.body.email,

        created_by : clientId
      });

      account.save (function (err) {
        if (err)
          return self.handleError (err, res, 500, 'failed to create account', callback);

        return res.status (200).send (true);
      });
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
    if (!req.account)
      return self.handleError (null, res, 404, 'account does not exist', callback);

    res.status (200).send (req.account.toObject ())
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
    if (!req.account)
      return self.handleError (null, res, 404, 'account does not exist', callback);

    var account = req.account;
    account.remove (function (err) {
      if (err)
        return self.handleError (err, res, 500, 'failed to delete the account', callback);

      return res.status (200).send (true);
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

    // Update the client, and save it.
    var account = req.account;
    account.enabled = req.body.enabled;

    account.save (function (err) {
      if (err)
        return self.handleError (err, res, 500, 'failed to enable account', callback);

      res.status (200).send (true);
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

  return function (req, res) {
    if (!req.account)
      return self.handleError (null, res, 404, 'account does not exist', callback);

    var account = req.account;
    account.roles = req.body.roles;

    account.save (function (err) {
      if (err)
        return self.handleError (err, res, 500, 'failed to update roles', callback);

      return res.status (200).send (true);
    });
  };
};

/**
 * Set the token for push notifications on the specified network.
 *
 * @param callback
 * @returns {Function}
 */
AccountController.prototype.setPushNotificationToken = function (callback) {
  var self = this;

  return function (req, res) {
    if (!self.hasAccessToAccount (req.user, req.account))
      return self.handleError (null, res, 401, 'User does not have access to account', callback);

    var network = req.body.network;
    var token = req.body.token;
    var account = req.account;

    // Update the network token
    account.apn[network] = token;

    account.save (function (err) {
      if (err)
        return self.handleError (err, res, 500, 'Failed to save push notification token', callback);

      return res.status (200).send (true);
    });
  }
};

module.exports = exports = AccountController;
