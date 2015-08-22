var winston     = require ('winston')
  , uid         = require ('uid-safe')
  , oauth2orize = require ('oauth2orize')
  , passport    = require ('passport')
  , blueprint   = require ('blueprint')
  ;

var Client      = blueprint.models.Client
  , Account     = blueprint.models.Account
  , AccessToken = blueprint.models.oauth2.AccessToken
  ;

const TOKEN_LENGTH  = 128;
const SECRET_LENGTH = 48;

/**
 * @class Oauth2Controller
 *
 * The Oauth2Controller provides methods for binding OAuth 2.0 routes to its implementation of
 * the OAuth 2.0 protocol.
 *
 * @param models
 * @constructor
 */
function Oauth2Controller () {
  blueprint.BaseController.call (this);
}

blueprint.controller (Oauth2Controller);

/**
 * Lookup a client by param.
 *
 * @returns {Function}
 */
Oauth2Controller.prototype.lookupClientByParam = function () {
  var self = this;

  return function (req, res, next, clientId) {
    winston.info ('searching for client ' + clientId);

    self._clientModel.findById (clientId, function (err, client) {
      if (err)
        return next (err);

      if (!client)
        return next (new Error ('Client does not exist'));

      req.client = client;
      return next ();
    });
  };
};

/**
 * Lookup a token by id.
 *
 * @returns {Function}
 */
Oauth2Controller.prototype.lookupTokenByParam = function () {
  var self = this;

  return function (req, res, next, tokenId) {
    winston.info ('searching for token ' + tokenId);

    self._accessTokenModel.findById (tokenId, function (err, token) {
      if (err)
        return next (err);

      if (!token)
        return next (new Error ('token does not exist'))

      req.token = token;
      next ();
    });
  };
};

Oauth2Controller.prototype.logoutUser = function () {
  var self = this;

  return [
    passport.authenticate ('bearer', {session : false}),
    function (req, res) {
      self._accessTokenModel.findByIdAndRemove (req.authInfo.token_id, function (err) {
        return res.status (200).send (err ? false : true);
      });
    }
  ];
};

/**
 * Delete a client from the database.
 *
 * @returns {Function}
 */
Oauth2Controller.prototype.deleteClient = function () {
  return function (req, res) {
    if (!req.client)
      return res.status (404).send ();

    var client = req.client;
    client.remove (function (err) {
      return res.send (200, err ? false : true);
    });
  };
};

Oauth2Controller.prototype.refreshSecret = function () {
  return function (req, res) {
    if (!req.client)
      return res.status (404).send ();

    var newSecret = uid.sync (SECRET_LENGTH);
    var client = req.client;

    // Update the secret, save it, and return it to the client.
    client.secret = newSecret;
    client.save (function (err) {
      return res.status (200).send (newSecret);
    });
  };
}

Oauth2Controller.prototype.updateClient = function () {
  return function (req, res) {
    if (!req.client)
      return res.status (404).send ();

    var client = req.client;
    client.name = req.body.name;
    client.redirect_uri = req.body.redirect_uri;
    client.email = req.body.email;

    client.save (function (err) {
      res.status (200).send (err ? false : true);
    });
  }
};

Oauth2Controller.prototype.enableClient = function () {
  return function (req, res) {
    if (!req.client)
      return res.status (404).send ();

    req.checkBody ('enabled', 'Enabled is a required Boolean').notEmpty ().isBoolean ();

    var errors = req.validationErrors ();

    if (errors)
      return res.status (400).send (errors);

    // Sanitize the parameters.
    req.sanitizeBody ('enabled').toBoolean ();

    // Update the client, and save it.
    var client = req.client;
    client.enabled = req.body.enabled;

    client.save (function (err) {
      res.status (200).send (err ? false : true);
    });
  };
};

Oauth2Controller.prototype.enableToken = function () {
  return function (req, res) {
    if (!req.token)
      return res.status (404).send ();

    req.checkBody ('enabled', 'Enabled is a required Boolean').notEmpty ().isBoolean ();

    var errors = req.validationErrors ();

    if (errors)
      return res.status (400).send (errors);

    // Sanitize the parameters.
    req.sanitizeBody ('enabled').toBoolean ();

    // Update the client, and save it.
    var token = req.token;
    winston.info ('enabling access token %s [state=%s]', token.id, req.body.enabled);

    token.enabled = req.body.enabled;
    token.save (function (err) {
      if (err)
        winston.error (err);

      res.status (200).send (err ? false : true);
    });
  };
};

/**
 * Delete an access token.
 *
 * @param callback
 * @returns {Function}
 */
Oauth2Controller.prototype.deleteToken = function (callback) {
  var self = this;

  return function (req, res) {
    if (!req.token)
      return self.handleError (null, res, 404, 'Token does not exist', callback);

    var token = req.token;
    winston.info ('deleting access token %s', token.id);

    token.remove (function (err) {
      if (err)
        return self.handleError (err, res, 500, 'Failed to delete token', callback);

      return res.status (200).send (true);
    });
  };
};

/**
 * Get the access token. The exchange workflow depends on the grant_type
 * body parameter.
 *
 * @param callback
 * @returns {Function}
 */
Oauth2Controller.prototype.getToken = function (callback) {
  var self = this;

  function authenticated (req, res, accessToken) {
    return res.status (200).json ({
      token_type    : 'Bearer',
      access_token  : accessToken.token,
      refresh_token : accessToken.refresh_token,
      expires_in    : accessToken.expires_in
    });
  }

  /**
   * Use the client credentials to get an access token.
   *
   * @param req
   * @param res
   */
  function client_credentials (req, res) {
    req.checkBody ('client_id', 'required').notEmpty();
    req.checkBody ('client_secret', 'required').notEmpty();

    var clientId = req.body.client_id;
    var clientSecret = req.body.client_secret;

    Client.findById (clientId, function (err, client) {
      if (err)
        return self.handleError (err, res, 500, 'Failed to find client', callback);

      if (!client)
        return self.handleError (null, res, 404, 'Client does not exist', callback);

      if (client.secret !== clientSecret)
        return self.handleError (null, res, 400, 'Client secret is invalid', callback);

      if (!client.enabled)
        return self.handleError (null, res, 401, 'Client is not enabled', callback);

      // Authenticate the username/password combo. Upon authentication, we
      // are to return the token/refresh_token combo.
      winston.log ('info', 'client %s: exchanging secret for access token', client.id);

      // Create a new user token and refresh token.
      AccessToken.newClientToken (TOKEN_LENGTH, client.id, '*', function (err, accessToken) {
        if (err)
          return self.handleError (err, res, 500, 'Failed to generate token', callback);

        return authenticated (req, res, accessToken);
      });
    });
  }

  /**
   * Use the username/password to get an access token.
   *
   * @param req
   * @param res
   */
  function password (req, res) {
    req.checkBody ('client_id', 'required').notEmpty();
    req.checkBody ('username', 'required').notEmpty();
    req.checkBody ('password', 'required').notEmpty();

    var errs = req.validationErrors (true);

    if (errs)
      return self.handleError (null, res, 400, errs, callback);

    var clientId = req.body.client_id;
    var username = req.body.username;
    var password = req.body.password;

    // Locate the client and make sure the client is enabled.
    Client.findById (clientId, function (err, client) {
      if (err)
        return self.handleError (err, res, 400, 'Cannot find client', callback);

      if (!client)
        return self.handleError (null, res, 400, 'Invalid client id', callback);

      if (!client.enabled)
        return self.handleError (null, res, 401, 'Client is not enabled', callback);

      // Authenticate the username/password combo. Upon authentication, we
      // are to return the token/refresh_token combo.
      winston.log ('info', 'client %s: exchanging username/password for access token [user=%s]', client.id, username);

      Account.findOne ({username: username}, function (err, account) {
        // Check the result of the operation. If the account does not exist or the
        // account is disabled, then return the appropriate error message.
        if (err)
          return self.handleError (err, res, 500, 'Failed to retrieve account', callback);

        if (!account)
          return self.handleError (err, res, 400, 'Account does not exist', callback);

        if (!account.enabled)
          return self.handleError (err, res, 401, 'Account is disabled', callback);

        account.verifyPassword (password, function (err, match) {
          // Check the result of the operation. If there is an error, or the password
          // does not match, then return an error.
          if (err)
            return self.handleError (err, res, 500, 'Failed to verify password', callback);

          if (!match)
            return self.handleError (err, res, 401, 'Password does not match', callback);

          // Create a new user token and refresh token.
          AccessToken.newUserToken (TOKEN_LENGTH, client.id, account.id, function (err, accessToken) {
            if (err)
              return self.handleError (err, res, 500, 'Failed to generate token', callback);

            return authenticated (req, res, accessToken);
          });
        });
      });
    });
  }

  return function (req, res) {
    req.checkBody ('grant_type', 'required').notEmpty ();
    var errs = req.validationErrors (true);

    if (errs)
      return self.handleError (null, res, 400, errs, callback);

    var grantTypes = {
      'password' : password,
      'client_credentials' : client_credentials
    };

    // Locate the handler for the grant type.
    var grantType = req.body.grant_type;
    var granter = grantTypes[grantType];

    if (!granter)
      return self.handleError (null, res, 400, 'Unsupported grant type', callback);

    // Handle the token request.
    granter (req, res);
  }
};

exports = module.exports = Oauth2Controller;
