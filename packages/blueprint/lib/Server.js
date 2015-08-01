var express      = require ('express')
  , validation   = require ('express-validator')
  , session      = require ('express-session')
  , bodyParser   = require ('body-parser')
  , cookieParser = require ('cookie-parser')
  , morgan       = require ('morgan')
  , winston      = require ('winston')
  , path         = require ('path')
  ;

const PATH_VIEWS = 'views';
const DEFAULT_VIEW_ENGINE = 'jade';
const DEFAULT_PORT = 8080;

function Server (appPath, opts) {
  this._opts = opts || {};
  this._app = express ();

  if (this._opts.morgan)
    this._app.use (morgan (this._opts.morgan.format, this._opts.morgan.options));

  if (this._opts.cookies)
    this._app.use (cookieParser (this._opts.cookies));

  this._app.use (bodyParser.urlencoded ({ extended: false }));
  this._app.use (bodyParser.json ());
  this._app.use (validation ());

  if (this._opts.session)
    this._app.use (session (config.session));

  // Setup the location of the views.
  this._app.set ('views', path.join (appPath, PATH_VIEWS));
  this._app.set ('view engine', DEFAULT_VIEW_ENGINE);
}

/**
 * Use a middleware with the server.
 */
Server.prototype.use = function () {
  this._app.use.apply (this._app, arguments);
};

Server.prototype.static = function (path) {
  this._app.use (express.static (path));
};

/**
 * Listen for request on the specified port.
 *
 * @param port
 */
Server.prototype.listen = function (port) {
  port = port || DEFAULT_PORT;
  var self = this;

  this._server = this._app.listen (port, function () {
    var host = self._server.address ().address;
    var port = self._server.address ().port;

    winston.log ('info', 'listening at http://%s:%s...', host, port);
  });
};

/**
 * Get the address of the server.
 */
Server.prototype.__defineGetter__ ('address', function () {
  if (!this._server)
    throw new Error ('must call listen() first');

  return this._server.address ();
});

module.exports = exports = Server;
