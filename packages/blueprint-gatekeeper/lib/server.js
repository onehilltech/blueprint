var passport = require ('passport')
  , mongoose = require ('mongoose')
  , express = require ('express')
  , cookieParser = require ('cookie-parser')
  , morgan = require ('morgan')
  , bodyParser = require ('body-parser')
  , winston = require ('winston')
  ;

//var session = require ('express-session')

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
function Server (opts) {
  this._opts = opts || {};
  this.app = express ();

  winston.info ('initializing the server application');

  // Configure the application.
  this.app.use (morgan (this._opts.morgan));
  this.app.use (bodyParser (this._opts.bodyParser));
  this.app.use (cookieParser (this._opts.cookieParser));
  this.app.use (passport.initialize ());

  // Initialize the application router.
  var router = require ('./router');
  this.app.use (router (this._opts.router));

  // Define the error handler.
  this.app.use (function (err, req, res, next) {
    winston.error (err.stack);
    res.status (500).send ('Something broke!');
  });
}

/**
 * Start the server. This method configures the server using the provided
 * options, and starts listening for requests.
 */
Server.prototype.start = function () {
  // Connect to the database.
  winston.info ('connecting to database ' + this._opts.connstr);
  mongoose.connect (this._opts.connstr, this._opts.mongodb);

  // Start listening for requests.
  this.http_ = this.app.listen (this._opts.port);
  winston.info ('listening on port ' + this._opts.port);
};

/**
 * Stop the server. This method closes the database connection, and stops
 * listening for events.
 */
Server.prototype.stop = function () {
  // Close the database connection.
  mongoose.connection.close ();

  // Stop listening for events.
  this.http_.close ();
}

module.exports = exports = Server;
