var BearerStrategy = require ('passport-http-bearer').Strategy,
    AccessToken    = require ('../models/access-token');

module.exports = function () {
  return new BearerStrategy (function (access_token, done) {
    // Locate the access token in our database. If we cannot locate the
    // access token, then we need to fail access to the resource. We also
    // need to fail access if the token has been disabled, or is not valid.
    AccessToken.findOne ({token : access_token}, function (err, token) {
      if (err) 
        return done (err);

      if (!token) 
        return done (null, false);

      if (token.disabled)
        return done (null, false);

      if (!token.account)
        return done (null, false);

      // to keep this example simple, restricted scopes are not implemented,
      // and this is just for illustrative purposes
      var info = { scope: '*' }
      done (null, token.account, info);
    });
  });
};
