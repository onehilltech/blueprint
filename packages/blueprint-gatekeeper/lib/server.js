var mongoose     = require ('mongoose'),
    express      = require ('express'),
    session      = require ('express-session'),
    cookieParser = require ('cookie-parser'),
    morgan       = require ('morgan'),
    bodyParser   = require ('body-parser'),
    passport     = require ('passport'),
    User         = require ('passport-control-common').models.User;

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

// Connect to the database. The database configuration comes from a 
// configuration file. Setup the callback for different events on the 
// connection.
var connect = function (opts) {
  console.log ('connecting to database: ' + opts.connstr);
  mongoose.connect (opts.connstr, opts.mongodb);
}

mongoose.connection.on ('error', function (err) {
  console.log (err);
});

/**
 * @class Server
 *
 * Wrapper class for the server object. The server is a wrapper
 * around the Express server.
 */
function Server () {
  this.app_ = express ();
}

/**
 * Start the server. This method configures the server using the provided
 * options, and starts listening for requests.
 */
Server.prototype.start = function (opts) {
  function init (app) {
    // Configure the application.
    app.use (morgan (opts.morgan));
    app.use (bodyParser (opts.bodyParser));
    app.use (cookieParser (opts.cookieParser));
    app.use (session (opts.session));

    app.use (passport.initialize ());
    app.use (passport.session ());

    // Set the application's router.
    console.log ('running version ' + opts.version + ' of the routes');
    require ('./routes/v' + opts.version) (app);
  }

  // Initialize the application.
  init (this.app_);

  // Connect to the database.
  connect (opts);

  // Start listening for requests.
  this.http_ = this.app_.listen (opts.port);
  console.log ('listening on port ' + opts.port);
};

module.exports = exports = function () {
  return new Server ();
}
