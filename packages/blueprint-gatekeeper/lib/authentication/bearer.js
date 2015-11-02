var BearerStrategy = require ('passport-http-bearer').Strategy
  , AccessToken    = require ('../../app/models/oauth2/AccessToken')
  , winston        = require ('winston')
  ;

module.exports = function () {
  return new BearerStrategy (function (accessToken, done) {
    winston.info ('[bearer]: validating access token', accessToken);

    // Locate the access token in our database. If we cannot locate the
    // access token, then we need to fail access to the resource. We also
    // need to fail access if the token has been disabled, or is not valid.
    AccessToken
      .findOne ({token : accessToken})
      .populate ('account client')
      .exec (function (err, token) {
        if (err)
          return done (err);

        if (!token)
          return done (null, false, {message: 'Token is invalid'});

        if (!token.enabled)
          return done (null, false, {message: 'Token is disabled'});

        if (!token.client)
          return done (null, false, {message: 'Token is for an unknown client'});

        if (!token.client.enabled)
          return done (null, false, {message: 'Client is disabled'});

        // If the token is for an account, then the account must be enabled.
        if (token.isAccountToken () && !token.account.enabled)
          return done (null, false, {message: 'User account is disabled'});

        winston.info ('[bearer]: access token validation successful');

        // to keep this example simple, restricted scopes are not implemented,
        // and this is just for illustrative purposes
        var info = {scope: '*', token: token}
        var user = token.account || token.client;

        return done (null, user, info);
    });
  });
};
