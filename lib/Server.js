var express      = require ('express')
  , winston      = require ('winston')
  , path         = require ('path')
  ;

const PATH_VIEWS = 'views';
const DEFAULT_VIEW_ENGINE = 'jade';
const DEFAULT_PORT = 8080;

/**
 * @class Server
 *
 * @param appPath
 * @param opts
 * @constructor
 */
function Server (appPath, opts) {
  this._opts = opts || {};
  this._app = express ();

  // Configure the different middleware for the server. Some of the middleware
  // is required. Some of the middleware is optional. For the middleware that is
  // required, we provide default options if no options are provided. For the
  // middleware that is optional, it is only included in the server if options
  // are provided for it.

  if (this._opts.morgan) {
    winston.log ('debug', 'morgan format: %s', this._opts.morgan.format);
    this._app.use(require('morgan')(this._opts.morgan.format, this._opts.morgan.options));
  }
  else {
    winston.log ('debug', 'morgan format: combined');
    this._app.use(require('morgan')('combined'));
  }

  // optional
  if (this._opts.cookies) {
    winston.log ('debug', 'cookie parser: %s', this._opts.cookies);
    this._app.use(require('cookie-parser')(this._opts.cookies));
  }

  // optional
  if (this._opts.bodyParser) {
    var bodyParser = require ('body-parser');
    var bodyParserOpts = this._opts.bodyParser;

    for (key in bodyParserOpts) {
      if (bodyParserOpts.hasOwnProperty(key)) {
        var f = bodyParser[key];

        if (!f)
          throw new Error(util.format('%s is an unsupported middleware type', key));

        winston.log ('debug', 'bodyParser.%s: %s', key, bodyParserOpts[key]);
        this._app.use (f.call (bodyParser, bodyParserOpts[key]));
      }
    }
  }

  // optional
  if (this._opts.validator) {
    winston.log ('debug', 'express validator: %s', this._opts.validator);
    this._app.use(require('express-validator')(this._opts.validator));
  }

  // optional
  if (this._opts.session) {
    winston.log ('debug', 'express session: %s', this._opts.session);
    this._app.use(require('express-session')(this._opts.session));
  }

  // Setup the location of the views.
  var staticPath = path.join (appPath, PATH_VIEWS);
  winston.log ('debug', 'static views: %s', staticPath);

  this._app.set ('views', staticPath);
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
  port = this._opts.port || DEFAULT_PORT;
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
