var blueprint = require ('@onehilltech/blueprint')
  , messaging = blueprint.messaging
  , ClientPasswordStrategy = require ('passport-oauth2-client-password').Strategy
  ;

var Client;

messaging.on ('app.init', function (app) {
  Client = app.models.Client;

  if (!Client)
    throw new Error ('AccessToken model not defined');
});

module.exports = exports = function () {
  return new ClientPasswordStrategy (function (id, secret, done) {
      Client.findById (id, function (err, client) {
        if (err) 
          return done (err);

        if (!client) 
          return done (null, false, {message: 'Client does not exist'});

        if (!client.enabled)
          return done (null, false, {message: 'Client is disabled'});

        // Check the secret. We do not store the secret in a crypted format
        // since it prevents the client from being able to see the secret when
        // managing their account.
        if (secret && client.secret !== secret)
          return done (null, false, {message: 'Client secret is invalid'});

        return done (null, client);
      });
    }
  );
};
