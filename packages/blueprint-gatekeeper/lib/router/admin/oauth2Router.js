var express = require ('express')
  , winston = require ('winston')
  ;

var OAuth2ViewController = require ('../../controllers/internal/oauth2ViewController')
  ;

function Oauth2AdminRouter (opts) {
  this._opts = opts || {};
  this.baseuri = '/admin/oauth2';
}

Oauth2AdminRouter.prototype.makeRouter = function () {
  var router = express.Router ();
  var oauth2ViewController = new OAuth2ViewController ();

  router.get    ('/admin/oauth2', function (req, res) {
    return res.render ('views/admin/oauth2/index');
  });

  // Define the client administration routes.
  router.param  ('client_id', oauth2ViewController.base.lookupClientByParam ());
  router.param  ('token_id', oauth2ViewController.base.lookupTokenByParam ());

  router.get    ('/admin/oauth2/clients', oauth2ViewController.viewClients ());
  router.get    ('/admin/oauth2/clients/new', oauth2ViewController.newClient ());
  router.post   ('/admin/oauth2/clients/new', oauth2ViewController.createClient ());

  router.get    ('/admin/oauth2/clients/:client_id', oauth2ViewController.viewClient ());
  router.post   ('/admin/oauth2/clients/:client_id', oauth2ViewController.base.updateClient ());
  router.delete ('/admin/oauth2/clients/:client_id', oauth2ViewController.base.deleteClient ());
  router.post   ('/admin/oauth2/clients/:client_id/enable', oauth2ViewController.base.enableClient ());
  router.get    ('/admin/oauth2/clients/:client_id/refresh-secret', oauth2ViewController.base.refreshSecret ());

  router.get    ('/admin/oauth2/tokens', oauth2ViewController.viewTokens ());
  router.get    ('/admin/oauth2/tokens/clients', oauth2ViewController.viewClientTokens ());
  router.get    ('/admin/oauth2/tokens/users', oauth2ViewController.viewUserTokens ());
  router.delete ('/admin/oauth2/tokens/:token_id', oauth2ViewController.base.deleteToken ());
  router.post   ('/admin/oauth2/tokens/:token_id/enable', oauth2ViewController.base.enableToken ());

  return router;
};

exports = module.exports = Oauth2AdminRouter;

