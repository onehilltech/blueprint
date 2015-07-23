var winston = require ('winston')
  , util    = require ('util')
  , uid     = require ('uid-safe');

var AdminController = require ('./adminController')
  , Client          = require ('../models/oauth2/client')
  , AccessToken     = require ('../models/oauth2/accessToken')
  ;

const SECRET_LENGTH = 48;

function Oauth2Controller (opts) {
  this._opts = opts || {};
}

util.inherits (Oauth2Controller, AdminController);

Oauth2Controller.prototype.logoutUser = function () {
  return function (req, res) {
    AccessToken.findByIdAndRemove (req.authInfo.token_id, function (err) {
      return res.status (200).send (err ? false : true);
    });
  };
};

Oauth2Controller.prototype.lookupClientByParam = function () {
  return function (req, res, next, clientId) {
    winston.info ('searching for client ' + clientId);

    Client.findById (clientId, function (err, client) {
      if (err)
        return next (err);

      if (!client)
        return next (new Error ('Client does not exist'))

      req.client = client;
      next ();
    });
  };
};

Oauth2Controller.prototype.lookupTokenByParam = function () {
  return function (req, res, next, tokenId) {
    winston.info ('searching for token ' + tokenId);

    AccessToken.findById (tokenId, function (err, token) {
      if (err)
        return next (err);

      if (!token)
        return next (new Error ('token does not exist'))

      req.token = token;
      next ();
    });
  };
}

Oauth2Controller.prototype.deleteClient = function () {
  return function (req, res) {
    var client = req.client;

    client.remove (function (err) {
      return res.send (200, err ? 'true' : 'false');
    });
  };
};

Oauth2Controller.prototype.refreshSecret = function () {
  return function (req, res) {
    var newSecret = uid.sync (SECRET_LENGTH);
    var client = req.client;

    // Update the secret, save it, and return it to the client.
    client.secret = newSecret;
    client.save (function (err) {
      return res.send (200, newSecret);
    });
  };
}

Oauth2Controller.prototype.updateClient = function () {
  return function (req, res) {
    winston.info (req.body);

    var client = req.client;

    client.name = req.body.name;
    client.redirect_uri = req.body.redirect_uri;
    client.email = req.body.email;

    client.save (function (err) {
      res.send (200, err ? false : true);
    });
  }
};

Oauth2Controller.prototype.enableClient = function () {
  return function (req, res) {
    req.checkBody ('enabled', 'Enabled is a required Boolean').notEmpty ().isBoolean ();

    var errors = req.validationErrors ();

    if (errors)
      return res.send (200, 'false');

    // Sanitize the parameters.
    req.sanitizeBody ('enabled').toBoolean ();

    // Update the client, and save it.
    var client = req.client;
    client.enabled = req.body.enabled;

    client.save (function (err) {
      if (err)
        winston.error (err);

      res.status (200).send (err ? 'false' : 'true');
    });
  };
}

Oauth2Controller.prototype.enableToken = function () {
  return function (req, res) {
    req.checkBody ('enabled', 'Enabled is a required Boolean').notEmpty ().isBoolean ();

    var errors = req.validationErrors ();

    if (errors)
      return res.send (200, 'false');

    // Sanitize the parameters.
    req.sanitizeBody ('enabled').toBoolean ();

    // Update the client, and save it.
    var token = req.token;
    winston.info ('enabling access token %s [state=%s]', token.id, req.body.enabled);

    token.enabled = req.body.enabled;
    token.save (function (err) {
      if (err)
        winston.error (err);

      res.status (200).send (err ? 'false' : 'true');
    });
  };
};

Oauth2Controller.prototype.deleteToken = function () {
  return function (req, res) {
    if (!req.token)
      return res.status (200).send (false);

    var token = req.token;
    winston.info ('deleting access token %s', token.id);

    token.remove (function (err) {
      return res.status (200).send (err ? 'true' : 'false');
    });
  };
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Views

Oauth2Controller.prototype.viewClients = function () {
  var self = this;

  return function (req, res) {
    Client.find ({}, function (err, clients) {
      self.renderWithAccessToken (req, res, 'views/admin/oauth2/clients/index', {clients: clients});
    })
  };
};

Oauth2Controller.prototype.viewClient = function () {
  var self = this;

  return function (req, res) {
    if (!req.client)
      return res.redirect ('/admin/oauth2/clients');

    self.renderWithAccessToken (req, res, 'views/admin/oauth2/clients/details', {client : req.client});
  };
};

Oauth2Controller.prototype.newClient = function () {
  return function (req, res) {
    res.render ('views/admin/oauth2/clients/new');
  };
};

Oauth2Controller.prototype.createClient = function () {
  return function (req, res) {
    winston.debug ('validating input parameters');

    req.checkBody ('name', 'Client name is missing').notEmpty ();
    req.checkBody ('email', 'Contact email acddress is missing').notEmpty ().isEmail ();
    req.checkBody ('redirect_uri', 'Redirect uri is missing').notEmpty ();

    var errors = req.validationErrors (true);

    if (errors) {
      winston.error (util.inspect (errors));

      return res.render ('views/admin/oauth2/clients/new', {
        input  : req.body,
        errors : errors
      });
    }

    var client = new Client ({
      name : req.body.name,
      email : req.body.email,
      secret : uid.sync (SECRET_LENGTH),
      redirect_uri : req.body.redirect_uri
    });

    client.save (function (err) {
      if (!err)
        return res.redirect ('/admin/oauth2/clients/' + client.id);

      return res.render ('views/admin/oauth2/clients/new', { errors: errors });
    });
  };
};

Oauth2Controller.prototype.viewTokens = function () {
  return function (req, res) {
    res.redirect ('/admin/oauth2/tokens/clients');
  };
};

Oauth2Controller.prototype.viewClientTokens = function () {
  return function (req, res) {
    AccessToken
        .find ({user : {$exists : false }})
        .populate ('client', '_id name')
        .exec (function (err, tokens) {
          res.render ('views/admin/oauth2/tokens/clients', {tokens : tokens});
        });
  };
};

Oauth2Controller.prototype.viewUserTokens = function () {
  return function (req, res) {
    AccessToken
        .find ({user : {$exists : true }})
        .populate ('account', '_id username')
        .populate ('client', '_id name')
        .exec (function (err, tokens) {
          res.render ('views/admin/oauth2/tokens/users', {tokens : tokens});
        });
  };
};

exports = module.exports = Oauth2Controller;

