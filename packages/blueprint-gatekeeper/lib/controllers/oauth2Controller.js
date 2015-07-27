var winston = require ('winston')
  , uid     = require ('uid-safe');

var Client      = require ('../models/oauth2/client')
  , AccessToken = require ('../models/oauth2/accessToken')
  ;

const SECRET_LENGTH = 48;

function Oauth2Controller (models) {
  this._accessTokenModel = models[AccessToken.modelName];
  this._clientModel = models[Client.modelName];
}

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

  return function (req, res) {
    self._accessTokenModel.findByIdAndRemove (req.authInfo.token_id, function (err) {
      return res.status (200).send (err ? false : true);
    });
  };
};

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

Oauth2Controller.prototype.deleteToken = function () {
  return function (req, res) {
    if (!req.token)
      return res.status (404).send (false);

    var token = req.token;
    winston.info ('deleting access token %s', token.id);

    token.remove (function (err) {
      return res.status (200).send (err ? false : true);
    });
  };
};

exports = module.exports = Oauth2Controller;
