var express          = require ('express')
  , winston          = require ('winston')
  , AccessToken      = require ('../models/oauth2/accessToken')
  , ClientController = require ('../controllers/oauth2/clientController')
  ;

function AdminRouter (opts) {
  this._opts = opts || {};
}

AdminRouter.prototype.get = function () {
  var router = express.Router ();
  var clientController = new ClientController ();

  // Define the
  router.param ('client_id', clientController.lookupClientParam ());

  router.get  ('/admin', clientController.getHomePage ());

  // Define the routes for the general purpose accounts.
  /*
  router.get    ('/accounts');
  router.post   ('/accounts');
  router.get    ('/accounts/:accountId');
  router.delete ('/accounts/:accountId');
  router.post   ('/accounts/:accountId/enable');*/

  // Define the OAuth 2.0 routes
  router.get    ('/admin/oauth2/clients', clientController.getClients ());
  router.get    ('/admin/oauth2/clients/new', clientController.newClient ());
  router.post   ('/admin/oauth2/clients/new', clientController.createClient ());

  router.get    ('/admin/oauth2/clients/:client_id', clientController.getClient ());
  router.post   ('/admin/oauth2/clients/:client_id', clientController.updateClient ());
  router.delete ('/admin/oauth2/clients/:client_id', clientController.deleteClient ());
  router.post   ('/admin/oauth2/clients/:client_id/enable', clientController.enableClient ());
  router.get    ('/admin/oauth2/clients/:client_id/refresh-secret', clientController.refreshSecret ());

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
