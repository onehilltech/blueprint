var express     = require ('express')
  , winston     = require ('winston')
  , oauth2orize = require ('oauth2orize')
  ;

var Client = require ('../../models/oauth2/client')
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
function OAuth2Router (opts) {
  this._opts = opts || {};

  if (this._opts.session === undefined)
    throw new Error ('Must provide session configuration in options');

  // Create the OAuth2 server.
  this._server = oauth2orize.createServer ();

  // Define the client serialization and deserialization methods. This will only
  // be used for grant types that require a session.
  this._server.serializeClient (function (client, done) {
    return done (null, client.id);
  });

  this._server.deserializeClient (function (id, done) {
    Client.findById (id, done);
  });

  this._grants = [
    require ('./refreshToken')(this._opts, this._server),
    require ('./password')(this._opts, this._server)
  ]
}

/**
 * Create the Router object for this strategy.
 *
 * @returns {Router}
 */
OAuth2Router.prototype.getRouter = function () {
  var router = express.Router ();

  this._grants.forEach (function (grant, index, arr) {
    winston.log ('info', 'building routes for [%s]', grant.name);
    grant.getRouter (router);
  });

  return router;
};

module.exports = exports = function (opts) {
  return new OAuth2Router (opts).getRouter ();
};



