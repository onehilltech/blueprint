var nconf    = require ('nconf'),
    passport = require ('passport'),
    mongoose = require ('mongoose'),
    models   = require ('./models');

var User = models.User;

// Define the serialization/deserialization methods.
passport.serializeUser (function (user, done) {
  done (null, user.id);
});

passport.deserializeUser (function (id, done) {
  User.findById (id, function (err, user) {
    if (err)
      return done (err);

    if (!user)
      return done (new Error ('failed to locate user'));

    done (null, user);
  });
});

// Export the client symbols.
exports.models = models;
exports.auth   = require ('./authentication');

// Export the server factory.
var Server = require ('./server');
exports.Server = Server;

// Load the node configuration.
var env = process.env.NODE_ENV || 'development';
nconf.env ().file ({file: './config/' + env + '.json'}).argv ();
var config = nconf.get ();

if (nconf.get ('daemon')) {
  // Create a new server is running in server mode.
  var daemon = Server ();

  console.log ('running the embedded server');
  daemon.start (nconf.get ('daemon'));

  // Export the daemon from the module.
  exports.daemon = daemon;
}
