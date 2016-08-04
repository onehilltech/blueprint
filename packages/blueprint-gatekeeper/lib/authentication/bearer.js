var blueprint      = require ('@onehilltech/blueprint')
  , BearerStrategy = require ('passport-http-bearer').Strategy
  , winston        = require ('winston')
  , async          = require ('async')
  ;

var AccessToken;

blueprint.messaging.on ('app.init', function (app) {
  AccessToken = app.models.oauth2.AccessToken;
});

// TODO Allow roles to be passed to options.

module.exports = exports = function (opts) {
  var tokenStrategy = opts.tokenStrategy;

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
            AccessToken.findById (payload.jti).populate ('client account').exec (callback);
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
            var user = accessToken.client._id;

            if (payload.kind === 'user') {
              if (!accessToken.account)
                return callback (new Error ('Unknown account'));

              if (!accessToken.account.enabled)
                return callback (new Error ('Account is disabled'));

              // Update the user to the account id.
              user = accessToken.account._id;
            }

            return callback (null, user, payload, accessToken);
          }
        ], callback);
      }

    ], function (err, user, payload, accessToken) {
      if (err) return done (err);

      var authInfo = {kind: payload.kind, scope: payload.roles, token: accessToken};
      return done (null, user, authInfo);
    });
  });
};
