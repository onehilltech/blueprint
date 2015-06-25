var winston = require ('winston')
  , util    = require ('util')
  , uid     = require ('uid-safe')
  , Client  = require ('../models/oauth2/client')
  ;

const SECRET_LENGTH=48;

function Oauth2Controller (opts) {
  this._opts = opts || {};
}

Oauth2Controller.prototype.getHomePage = function () {
  return function (req, res) {
    res.render ('admin/index');
  }
};

Oauth2Controller.prototype.logoutUser = function (tokenId, done) {
  AccessToken.findByIdAndRemove (tokenId, done);
};

Oauth2Controller.prototype.getClients = function () {
  return function (req, res) {
    Client.find ({}, function (err, clients) {
      return res.render ('admin/clients/index', {clients: clients});
    })
  };
};

Oauth2Controller.prototype.newClient = function () {
  return function (req, res) {
    res.render ('admin/clients/new');
  };
};

Oauth2Controller.prototype.createClient = function () {
  return function (req, res) {
    winston.debug ('validating input parameters');

    req.checkBody ('name', 'Client name is missing').notEmpty ();
    req.checkBody ('email', 'Contact email acddress is missing').notEmpty ().isEmail ();
    req.checkBody ('redirect_uri', 'Redirect uri is missing').notEmpty ();

    var errors = req.validationErrors ();

    if (errors) {
      winston.error (util.inspect (errors));

      return res.render ('admin/clients/new', {
        errors: errors
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
        return res.redirect ('/clients/' + client.id);

      return res.render ('admin/clients/new', { errors: errors });
    });
  };
};

Oauth2Controller.prototype.deleteClient = function () {
  return function (req, res) {
    var client = req.client;

    client.remove (function (err) {
      if (err)
        return res.render ('admin/clients/details', {client : req.client});

      return res.redirect ('/clients');
    });
  };
};

Oauth2Controller.prototype.getClient = function () {
  return function (req, res) {
    if (!req.client)
      return res.redirect ('/clients');

    return res.render ('admin/clients/details', {client : req.client});
  };
}

Oauth2Controller.prototype.updateClient = function () {
  return function (req, res) {
    var client = req.client;

    client.name = req.body.name;
    client.redirect_uri = req.body.redirect_uri;
    client.email = req.body.email;

    client.save (function (err) {
      return res.render ('admin/clients/details', {client : client});
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

      res.send (200, err ? 'false' : 'true');
    });
  };
}

exports = module.exports = Oauth2Controller;

