var blueprint      = require ('@onehilltech/blueprint')
  , messaging      = blueprint.messaging
  , BearerStrategy = require ('passport-http-bearer').Strategy
  , winston        = require ('winston')
  , async          = require ('async')
  , _              = require ('underscore')
  ;

var AccessToken;

messaging.on ('app.init', function (app) {
  AccessToken = app.models.oauth2.AccessToken;
});

// TODO Allow roles to be passed to options.

module.exports = exports = function (opts) {
  var tokenStrategy = opts.tokenStrategy;

  var accountPopulation =  {
    '_id': 1,
    'username': 1,
    'email': 1,
    'enabled': 1,
    'scope': 1,
    'activation.required': 1,
    'activation.date': 1
  };

  var clientPopulation = {
    _id: 1,
    name: 1,
    email: 1,
    enabled: 1,
    scope: 1,
    metadata: 1
  };

  return new BearerStrategy (function (token, done) {
    async.waterfall ([
      // Verify the token.
      function (callback) {
        tokenStrategy.verifyToken (token, {}, callback);
      },

      // Locate details about the token in the database.
      function (payload, callback) {
        AccessToken
          .findById (payload.jti)
          .populate ('client', clientPopulation)
          .populate ('account', accountPopulation)
          .exec (function (err, accessToken) {
            return callback (err, payload, accessToken);
          });
      }
    ], function (err, payload, accessToken) {
      if (err) {
        // Process the error message. We have to check the name because the error
        // could be related to token verification.
        if (err.name === 'TokenExpiredError')
          return done (null, false, {message: 'Token has expired'});

        if (err.name === 'JsonWebTokenError')
          return done (null, false, {message: err.message});

        return done (err);
      }

      if (!accessToken)
        return done (null, false, {message: 'Unknown access token'});

      if (!accessToken.enabled)
        return done (null, false, {message: 'Token is disabled'});

      if (!accessToken.client)
        return done (null, false, {message: 'Unknown client'});

      if (!accessToken.client.enabled)
        return done (null, false, {message: 'Client is disabled'});

      // Set the user to the client id.
      var user = accessToken.client;

      if (payload.kind === 'user') {
        if (!accessToken.account)
          return done (null, false, {message: 'Unknown account'});

        if (!accessToken.account.enabled)
          return done (null, false, {message: 'Account is disabled'});

        // Update the user to the account id.
        user = accessToken.account;
      }

      var authInfo = {scope: payload.scope, token: accessToken};
      return done (null, user, authInfo);
    });
  });
};
