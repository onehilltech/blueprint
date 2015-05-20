var winston = require ('winston');
var LocalStrategy = require ('passport-local').Strategy;
var Account = require ('../models/account');

module.exports = function (opts) {
  var opts = opts || {};

  return new LocalStrategy (opts, function (username, password, done) {
    winston.info ('authenticating username %s', username);

    Account.findOne ({ username: username }, function (err, user) {
      if (err) {
        winston.error (err);
        return done (err);
      }

      if (!user) {
        winston.error ('username %s does not exist', username);
        return done (null, false, { message: 'Incorrect username' });
      }

      if (user.disabled) {
        winston.error ('%s account is disabled; access not authorized', username);    
        return done (null, false, { message: 'Account is disabled'});    
      }

      user.verifyPassword (password, function (err, match) {
        if (err) {
          winston.error (err);
          return done (err);
        }

        if (!match) {
          winston.error ('password for %s does not match', username);
          return done (null, false, {message: 'Incorrect password'});
        }

        return done (null, user);
      });
    });
  });
};
