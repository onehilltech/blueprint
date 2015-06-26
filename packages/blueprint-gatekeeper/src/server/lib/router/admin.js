var express          = require ('express')
  , winston          = require ('winston')
  , AccessToken      = require ('../models/oauth2/accessToken')
  , Client           = require ('../models/oauth2/client')
  , OAuth2Controller = require ('../controllers/oauth2Controller')
  ;

function AdminRouter (opts) {
  this._opts = opts || {};
}

AdminRouter.prototype.get = function () {
  var router = express.Router ();
  var oauth2Controller = new OAuth2Controller ();

  router.param ('client_id', function (req, res, next, client_id) {
    winston.info ('searching for client ' + client_id);

    Client.findById (client_id, function (err, client) {
      if (err)
        return next (err);

      if (!client)
        return next (new Error ('Client does not exist'))

      req.client = client;
      next ();
    });
  });

  router.get  ('/', oauth2Controller.getHomePage ());

  // Define the routes for the clients.
  router.get    ('/clients', oauth2Controller.getClients ());
  router.post   ('/clients', oauth2Controller.createClient ());
  router.get    ('/clients/new', oauth2Controller.newClient ());

  router.get    ('/clients/:client_id', oauth2Controller.getClient ());
  router.post   ('/clients/:client_id', oauth2Controller.updateClient ());
  router.delete ('/clients/:client_id', oauth2Controller.deleteClient ());
  router.post   ('/clients/:client_id/enable', oauth2Controller.enableClient ());
  router.get    ('/clients/:client_id/refresh-secret', oauth2Controller.refreshSecret ());

  // Define the routes for the codes.
  router.get ('/codes', function (req, res) {
    res.render ('admin/codes');

  });

  // Define the routes for the tokens.
  router.get ('/tokens', function (req, res) {
    AccessToken.find ({}, function (err, docs) {
      res.render ('admin/tokens', {tokens : docs});
    });
  });

  return router;
};

module.exports = function admin (opts) {
  return new AdminRouter (opts).get ();
};
