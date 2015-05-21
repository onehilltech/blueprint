var passport = require ('passport');
var mongoose = require ('mongoose');
var express = require ('express');
var session = require ('express-session');
var cookieParser = require ('cookie-parser');
var morgan = require ('morgan');
var bodyParser = require ('body-parser');
var winston = require ('winston');

// Define the serialization/deserialization methods. The serialization method
// just returns to user id. The deserialization method locates the account by
// the user id.
passport.serializeUser (function (user, done) {
  done (null, user.id);
});

passport.deserializeUser (function (id, done) {
  Account.findById (id, function (err, user) {
    if (err)
      return done (err);

    if (!user)
      return done (new Error ('User does not exist'));

    done (null, user);
  });
});

mongoose.connection.on ('error', function (err) {
  winston.error (err);
});

mongoose.connection.on ('disconnect', function () {
  winston.debug ('connection to database terminated');
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
    console.log ('initializing the server application');

    // Configure the application.
    app.use (morgan (opts.morgan));
    app.use (bodyParser (opts.bodyParser));
    app.use (cookieParser (opts.cookieParser));
    app.use (session (opts.session));

    app.use (passport.initialize ());
    app.use (passport.session ());

    // Initialize the application router.
    var router = require ('./router');   
    app.use (router (opts.router));

    // Define the error handler.
    app.use (function(err, req, res, next) {
      winston.error (err.stack);
      res.status (500).send ('Something broke!');
    });
  }

  // Initialize the application.
  init (this.app_);

  // Connect to the database.
  winston.debug ('database connection is ' + opts.connstr);
  mongoose.connect (opts.connstr, opts.mongodb);

  // Start listening for requests.
  this.http_ = this.app_.listen (opts.port);
  winston.debug ('listening on port ' + opts.port);
};

module.exports = exports = function () {
  return new Server ();
}
