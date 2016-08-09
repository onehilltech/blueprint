var winston       = require ('winston')
  , LocalStrategy = require ('passport-local').Strategy
  , blueprint     = require ('@onehilltech/blueprint')
  , messaging     = blueprint.messaging
  ;

var Account;

messaging.once ('app.init', function (app) {
  Account = app.models.Account;

  if (!Account)
    throw new Error ('AccessToken model not defined');
});

module.exports = exports = function (opts) {
  opts = opts || {};

  return new LocalStrategy (opts, function (username, password, done) {
    winston.info ('using password authentication for ' + username);

    Account.findOne ({ username: username }, function (err, account) {
      if (err)
        return done (err);

      if (!account)
        return done (null, false, { message: 'User does not exist' });

      if (!account.enabled)
        return done (null, false, { message: 'User account is disabled'});

      account.verifyPassword (password, function (err, match) {
        if (err)
          return done (err);

        if (!match)
          return done (null, false, { message: 'Incorrect password'});

        return done (null, account);
      });
    });
  });
};
