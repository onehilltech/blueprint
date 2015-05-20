var ClientPasswordStrategy = require ('passport-oauth2-client-password').Strategy,
    Client = require ('../models/oauth2/client');

module.exports = exports = function () {
  return new ClientPasswordStrategy (
    function (id, secret, done) {
      Client.findById (id, function (err, client) {
        if (err) 
          return done (err);

        if (!client) 
          return done (null, false);

        if (client.disabled)
          return done (new Error ('Client is disabled'));

        // Check the secret. We do not store the secret in a crypted format
        // since it prevents the client from being able to see the secret when
        // managing their account.
        if (client.secret !== secret) 
          return done (null, false);

        return done (null, client);
      });
    }
  );
};
