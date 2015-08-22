var BearerStrategy = require ('passport-http-bearer').Strategy
  , AccessToken    = require ('.././accessToken')
  , winston        = require ('winston')
  ;

module.exports = function (mongoose) {
  var model = mongoose.models[AccessToken.modelName];

  return new BearerStrategy (function (accessToken, done) {
    winston.info ('[bearer]: validating access token', accessToken);

    // Locate the access token in our database. If we cannot locate the
    // access token, then we need to fail access to the resource. We also
    // need to fail access if the token has been disabled, or is not valid.
    model.findOne ({token : accessToken}, function (err, token) {
      if (err)
        return done (err);

      if (!token)
        return done (null, false, {message: 'Token is invalid'});

      if (token.disabled)
        return done (null, false, {message: 'Token is disabled'});

      winston.info ('[bearer]: access token validation successful');

      // to keep this example simple, restricted scopes are not implemented,
      // and this is just for illustrative purposes
      var info = {scope: '*', token_id: token.id}
      var user = token.account || token.client;

      return done (null, user, info);
    });
  });
};
