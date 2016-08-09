var blueprint      = require ('@onehilltech/blueprint')
  , messaging      = blueprint.messaging
  , BearerStrategy = require ('passport-http-bearer').Strategy
  , winston        = require ('winston')
  , async          = require ('async')
  , _              = require ('underscore')
  ;

var AccessToken;

messaging.once ('app.init', function (app) {
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
    'roles': 1,
    'activation.required': 1,
    'activation.date': 1
  };

  var clientPopulation = {
    _id: 1,
    name: 1,
    email: 1,
    enabled: 1,
    roles: 1,
    metadata: 1
  };

  return new BearerStrategy (function (token, done) {
    async.waterfall ([
      function (callback) {
        // First, verify the token. There is no need to continue if we cannot
        // verify the authenticity of the token.
        tokenStrategy.verifyToken (token, {}, callback);
      },

      function (payload, callback) {
        async.waterfall ([
          // Locate the access token in the database.
          function (callback) {
            AccessToken
              .findById (payload.jti)
              .populate ('client', clientPopulation)
              .populate ('account', accountPopulation)
              .exec (callback);
          },

          // Validate if the token can access the resources.
          function (accessToken, callback) {
            if (!accessToken)
              return callback (new Error ('Unknown access token'));

            if (!accessToken.enabled)
              return callback (new Error ('Access token is disabled'));

            if (!accessToken.client)
              return callback (new Error ('Client is unknown'));

            if (!accessToken.client.enabled)
              return callback (new Error ('Token is from an unknown client'));

            // Set the user to the client id.
            var user = accessToken.client;

            if (payload.kind === 'user') {
              if (!accessToken.account)
                return callback (new Error ('Unknown account'));

              if (!accessToken.account.enabled)
                return callback (new Error ('Account is disabled'));

              // Update the user to the account id.
              user = accessToken.account;
            }

            return callback (null, user, payload, accessToken);
          }
        ], callback);
      }

    ], function (err, user, payload, accessToken) {
      if (err) return done (err);

      var authInfo = {scope: payload.kind, token: accessToken};
      return done (null, user, authInfo);
    });
  });
};
