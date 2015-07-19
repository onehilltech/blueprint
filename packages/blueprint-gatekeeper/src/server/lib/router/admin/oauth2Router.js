var express           = require ('express')
  , winston           = require ('winston')
  , ClientController  = require ('../../controllers/oauth2/clientController')
  ;

function Oauth2AdminRouter (opts) {
  this._opts = opts || {};
  this.baseuri = '/admin/oauth2';
}

Oauth2AdminRouter.prototype.makeRouter = function () {
  var router = express.Router ();
  var clientController = new ClientController ();

  router.get    ('/admin/oauth2', function (req, res) {
    return res.render ('views/admin/oauth2/index');
  });

  // Define the client administration routes.
  router.param  ('client_id', clientController.lookupClientByParam ());
  router.get    ('/admin/oauth2/clients', clientController.viewClients ());
  router.get    ('/admin/oauth2/clients/new', clientController.newClient ());
  router.post   ('/admin/oauth2/clients/new', clientController.createClient ());

  router.get    ('/admin/oauth2/clients/:client_id', clientController.viewClient ());
  router.post   ('/admin/oauth2/clients/:client_id', clientController.updateClient ());
  router.delete ('/admin/oauth2/clients/:client_id', clientController.deleteClient ());
  router.post   ('/admin/oauth2/clients/:client_id/enable', clientController.enableClient ());
  router.get    ('/admin/oauth2/clients/:client_id/refresh-secret', clientController.refreshSecret ());

  return router;
};

exports = module.exports = Oauth2AdminRouter;

