var express     = require ('express')
  , winston     = require ('winston')
  ;

var Oauth2Controller = require ('../../../../app/controllers/Oauth2Controller')
  ;


/**
 * @class OAuth2Router
 *
 * The OAuth 2.0 router for the framework. The router can be initialized to support
 * different granting types. The current types supported are:
 *
 * = code
 * = password
 * = refresh_token
 *
 * If a grant type is not supported, then the corresponding routes will not be
 * available on the router.
 */
function OAuth2Router () {

}

/**
 * Create the Router object for this strategy.
 *
 * @returns {Router}
 */
OAuth2Router.prototype.makeRouter = function (models) {
  winston.info ('making OAuth 2.0 router');

  var router = express.Router ();
  var oauth2Controller = new Oauth2Controller (models);

  // Define the logout route for Oauth2.
  router.get  ('/oauth2/logout', oauth2Controller.logoutUser ());
  router.post ('/oauth2/token', oauth2Controller.grantToken ());

  return router;
};

module.exports = exports = OAuth2Router;
