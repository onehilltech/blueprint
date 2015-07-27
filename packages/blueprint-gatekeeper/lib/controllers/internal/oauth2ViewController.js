var winston = require ('winston')
  , util    = require ('util')
  , uid     = require ('uid-safe');

var ViewController   = require ('./viewController')
  , Oauth2Controller = require ('./../oauth2Controller')
  , Client           = require ('../../models/oauth2/client')
  , AccessToken      = require ('../../models/oauth2/accessToken')
  ;

const SECRET_LENGTH = 48;

function Oauth2ViewController () {
  ViewController.call (this);

  this.base = new Oauth2Controller ();
}

util.inherits (Oauth2ViewController, ViewController);

Oauth2ViewController.prototype.viewClients = function () {
  var self = this;

  return function (req, res) {
    Client.find ({}, function (err, clients) {
      self.renderWithAccessToken (req, res, 'views/admin/oauth2/clients/index', {clients: clients});
    })
  };
};

Oauth2ViewController.prototype.viewClient = function () {
  var self = this;

  return function (req, res) {
    if (!req.client)
      return res.redirect ('/admin/oauth2/clients');

    self.renderWithAccessToken (req, res, 'views/admin/oauth2/clients/details', {client : req.client});
  };
};

Oauth2ViewController.prototype.newClient = function () {
  return function (req, res) {
    res.render ('views/admin/oauth2/clients/new');
  };
};

Oauth2ViewController.prototype.createClient = function () {
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

Oauth2ViewController.prototype.viewTokens = function () {
  return function (req, res) {
    res.redirect ('/admin/oauth2/tokens/clients');
  };
};

Oauth2ViewController.prototype.viewClientTokens = function () {
  return function (req, res) {
    AccessToken
        .find ({user : {$exists : false }})
        .populate ('client', '_id name')
        .exec (function (err, tokens) {
          res.render ('views/admin/oauth2/tokens/clients', {tokens : tokens});
        });
  };
};

Oauth2ViewController.prototype.viewUserTokens = function () {
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

exports = module.exports = Oauth2ViewController;

