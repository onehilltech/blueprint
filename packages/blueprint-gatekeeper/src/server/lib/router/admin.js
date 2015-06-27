var express          = require ('express')
  , winston          = require ('winston')
  , AccessToken      = require ('../models/oauth2/accessToken')
  , Client           = require ('../models/oauth2/client')
  , OAuth2Controller = require ('../controllers/admin/oauth2Controller')
  ;

function AdminRouter (opts) {
  this._opts = opts || {};
}

AdminRouter.prototype.get = function () {
  var router = express.Router ();
  var oauth2Controller = new OAuth2Controller ();
  //var accountController = new AccountController ();

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

  router.get  ('/admin', oauth2Controller.getHomePage ());

  // Define the routes for the general purpose accounts.
  /*
  router.get    ('/accounts');
  router.post   ('/accounts');
  router.get    ('/accounts/:accountId');
  router.delete ('/accounts/:accountId');
  router.post   ('/accounts/:accountId/enable');*/

  // Define the OAuth 2.0 routes
  router.get    ('/admin/oauth2/clients', oauth2Controller.getClients ());
  router.get    ('/admin/oauth2/clients/new', oauth2Controller.newClient ());
  router.post   ('/admin/oauth2/clients/new', oauth2Controller.createClient ());

  router.get    ('/admin/oauth2/clients/:client_id', oauth2Controller.getClient ());
  router.post   ('/admin/oauth2/clients/:client_id', oauth2Controller.updateClient ());
  router.delete ('/admin/oauth2/clients/:client_id', oauth2Controller.deleteClient ());
  router.post   ('/admin/oauth2/clients/:client_id/enable', oauth2Controller.enableClient ());
  router.get    ('/admin/oauth2/clients/:client_id/refresh-secret', oauth2Controller.refreshSecret ());

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
