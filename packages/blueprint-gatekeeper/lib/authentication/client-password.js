var winston = require ('winston')
  , ClientPasswordStrategy = require ('passport-oauth2-client-password').Strategy
  , Client = require ('../models/client')
  ;

module.exports = exports = function () {
  return new ClientPasswordStrategy (
    function (id, secret, done) {
      winston.info ('authenticating login client %s', id);

      Client.findById (id, function (err, client) {
        if (err) 
          return done (err);

        if (!client) 
          return done (null, false, {message: 'Client does not exist'});

        if (client.disabled)
          return done (null, false, {message: 'Client is disabled'});

        // Check the secret. We do not store the secret in a crypted format
        // since it prevents the client from being able to see the secret when
        // managing their account.
        if (client.secret !== secret)
          return done (null, false, {message: 'Client secret is invalid'});

        return done (null, client);
      });
    }
  );
};
