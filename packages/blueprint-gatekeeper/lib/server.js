var passport     = require ('passport'),
    express      = require ('express'),
    session      = require ('express-session'),
    cookieParser = require ('cookie-parser'),
    morgan       = require ('morgan'),
    bodyParser   = require ('body-parser');

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
  }

  // Initialize the application.
  init (this.app_);

  // Start listening for requests.
  this.http_ = this.app_.listen (opts.port);
  console.log ('listening on port ' + opts.port);
};

module.exports = exports = function () {
  return new Server ();
}
