var express      = require ('express')
  , validation   = require ('express-validator')
  , session      = require ('express-session')
  , bodyParser   = require ('body-parser')
  , cookieParser = require ('cookie-parser')
  , morgan       = require ('morgan')
  , winston      = require ('winston')
  ;

function Server (basePath, opts) {
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

  this._app.use (express.static (path.join (basePath, '/public_html')));
}

/**
 * Use a middleware with the server.
 */
Server.prototype.use = function () {
  this._app.use (arguments);
};

/**
 * Listen for request on the specified port.
 *
 * @param port
 */
Server.prototype.listen = function (port) {
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
