var passport    = require ('passport')
  , express     = require ('express')
  , winston     = require ('winston')
  , oauth2orize = require ('oauth2orize')
  , util        = require ('util')
  ;

var AccessToken = require ('../../models/oauth2/accessToken')
  , Account     = require ('../../models/account')
  , BaseGrantRouter = require ('./baseGrantRouter');

const NAME = 'refresh_token';

// Use the client authentication strategy.
passport.use (require ('../../authentication/client') ());
passport.use (require ('../../authentication/clientPassword') ());

function RefreshTokenRouter (opts, server) {
  BaseGrantRouter.call (this, NAME, opts, server);
  var self = this;

  this._server.exchange (NAME,
    oauth2orize.exchange.refreshToken (function (client, refresh_token, scope, done) {
      // Locate the original access token that corresponds to this refresh
      // token. If we cannot find the original access token, then we need to
      // return an error to the user.
      winston.log ('client %s is refreshing access token', client.id);
      AccessToken.refreshAndSave (self._tokenLength, client.id, refresh_token, function (err, accessToken, refreshToken) {
        if (err)
          return done (new oauth2orize.TokenError ('Failed to refresh token', 'invalid_request'));

        return done (err, accessToken, refreshToken);
      });
    }));
}

util.inherits (RefreshTokenRouter, BaseGrantRouter);

RefreshTokenRouter.prototype.appendRouter = function (router, strategies) {
  // This endpoint is used by all OAuth 2.0 authentication approaches to
  // provide a token.
  router.post('/oauth2/token',
    [
      passport.authenticate (strategies , {session : false}),
      this._server.token (),
      this._server.errorHandler()
    ]
  );
}

module.exports = exports = function (opts, server) {
  return new RefreshTokenRouter (opts, server);
};
