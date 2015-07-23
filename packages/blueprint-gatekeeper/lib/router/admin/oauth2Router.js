var express           = require ('express')
  , winston           = require ('winston')
  , OAuth2Controller  = require ('../../controllers/oauth2Controller')
  ;

function Oauth2AdminRouter (opts) {
  this._opts = opts || {};
  this.baseuri = '/admin/oauth2';
}

Oauth2AdminRouter.prototype.makeRouter = function () {
  var router = express.Router ();
  var oauth2Controller = new OAuth2Controller ();

  router.get    ('/admin/oauth2', function (req, res) {
    return res.render ('views/admin/oauth2/index');
  });

  // Define the client administration routes.
  router.param  ('client_id', oauth2Controller.lookupClientByParam ());
  router.param  ('token_id', oauth2Controller.lookupTokenByParam ());

  router.get    ('/admin/oauth2/clients', oauth2Controller.viewClients ());
  router.get    ('/admin/oauth2/clients/new', oauth2Controller.newClient ());
  router.post   ('/admin/oauth2/clients/new', oauth2Controller.createClient ());

  router.get    ('/admin/oauth2/clients/:client_id', oauth2Controller.viewClient ());
  router.post   ('/admin/oauth2/clients/:client_id', oauth2Controller.updateClient ());
  router.delete ('/admin/oauth2/clients/:client_id', oauth2Controller.deleteClient ());
  router.post   ('/admin/oauth2/clients/:client_id/enable', oauth2Controller.enableClient ());
  router.get    ('/admin/oauth2/clients/:client_id/refresh-secret', oauth2Controller.refreshSecret ());

  router.get    ('/admin/oauth2/tokens', oauth2Controller.viewTokens ());
  router.get    ('/admin/oauth2/tokens/clients', oauth2Controller.viewClientTokens ());
  router.get    ('/admin/oauth2/tokens/users', oauth2Controller.viewUserTokens ());
  router.delete ('/admin/oauth2/tokens/:token_id', oauth2Controller.deleteToken ());
  router.post   ('/admin/oauth2/tokens/:token_id/enable', oauth2Controller.enableToken ());

  return router;
};

exports = module.exports = Oauth2AdminRouter;

