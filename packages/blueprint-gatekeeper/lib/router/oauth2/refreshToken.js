var passport    = require ('passport')
  , express     = require ('express')
  , winston     = require ('winston')
  , oauth2orize = require ('oauth2orize')
  , util        = require ('util')
  ;

var AccessToken = require ('../../models/oauth2/access-token')
  , Account     = require ('../../models/account')
  , BaseGrantRouter = require ('./baseGrantRouter');

passport.use (require ('../../authentication/client') ());

const NAME = 'refresh_token';

function RefreshTokenRouter (opts, server) {
  BaseGrantRouter.call (this, NAME, opts, server);

  this._server.exchange (NAME,
    oauth2orize.exchange.refreshToken (function (client, refresh_token, scope, done) {
      // Make sure the client is allowed to refresh its token. We do not want
      // to allow unauthorized clients access to protected resources.
      if (client.disabled)
        return done (new oauth2orize.AuthorizationError ('Client is disabled', 'unauthorized_client'));

      // Locate the original access token that corresponds to this refresh
      // token. If we cannot find the original access token, then we need to
      // return an error to the user.
      winston.log ('client %s is refreshing access token', client.id);

      AccessToken.findOne ({client : client.id, refresh_token: refresh_token}, function (err, at) {
        if (err)
          return done (new oauth2orize.AuthorizationError (err.message, 'invalid_request'));

        if (!at)
          return done (new oauth2orize.TokenError ('Access token is not valid', 'invalid_request'));

        // Refresh and save the access token.
        at.refreshAndSave (function (err, accessToken, refreshToken) {
          return done (err, accessToken, refreshToken);
        });
      });
    }));
}

util.inherits (RefreshTokenRouter, BaseGrantRouter);

RefreshTokenRouter.prototype.getRouter = function (router) {
  // This endpoint is used by all OAuth 2.0 authentication approaches to
  // provide a token.
  router.post('/oauth2/token',
    [
      passport.authenticate (['oauth2-client', 'oauth2-client-password'], {session : false}),
      this._server.token (),
      this._server.errorHandler()
    ]
  );
}

module.exports = exports = function (opts, server) {
  return new RefreshTokenRouter (opts, server);
};
