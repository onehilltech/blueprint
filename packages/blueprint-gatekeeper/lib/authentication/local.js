var LocalStrategy = require ('passport-local').Strategy,
    User          = require ('../models/user');

module.exports = function (opts) {
  var opts = opts || {usernameField: 'email'};

  return new LocalStrategy (opts, function (username, password, done) {
    User.findOne ({ email: username }, function (err, user) {
      if (err) 
        return done (err);

      if (!user)
        return done (null, false, { message: 'Incorrect username' });

      user.verify_password (password, function (err, match) {
        if (err)
          return done (err);

        if (!match)
          return done (null, false, {message: 'Incorrect password'});

        return done (null, user);
      });
    });
  });
};
