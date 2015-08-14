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
  // Store the options, and make sure the default options are set.
  this._opts = opts || { };

  if (!this._opts.morgan)
    this._opts.morgan = { format : 'combined' };

  // Make a new express application.
  this._app = express ();

  // Configure the different middleware for the server. Some of the middleware
  // is required. Some of the middleware is optional. For the middleware that is
  // required, we provide default options if no options are provided. For the
  // middleware that is optional, it is only included in the server if options
  // are provided for it.

  var configurators = {
    morgan : function (app, opts) {
      winston.log ('debug', 'morgan format: %s', opts.format);
      app.use (require ('morgan')(opts.format, opts.options));
    },

    cookies : function (app, opts) {
      winston.log('debug', 'cookie parser: %s', opts.cookies);
      app.use(require('cookie-parser')(opts.cookies));
    },

    bodyParser : function (app, opts) {
      var bodyParser = require('body-parser');

      for (key in opts) {
        if (opts.hasOwnProperty(key)) {
          var f = opts[key];

          if (!f)
            throw new Error(util.format('%s is an unsupported middleware type', key));

          winston.log('debug', 'bodyParser.%s: %s', key, opts[key]);
          app.use(f.call(opts, opts[key]));
        }
      }
    },

    validator : function (app, opts) {
      winston.log('debug', 'express validator: %s', opts);
      app.use(require('express-validator')(opts));
    },

    session : function (app, opts) {
      winston.log('debug', 'express session: %s', opts);
      app.use(require('express-session')(opts));
    },

    statics : function (app, opts) {
      // Initialize the static paths for the server.
      opts.forEach(function (staticPath) {
        staticPath = path.resolve(appPath, staticPath);
        winston.log ('debug', 'static path: ', staticPath);

        app.use(express.static(staticPath));
      });
    }
  };

  for (var key in this._opts) {
    if (this._opts.hasOwnProperty (key)) {
      // Locate the configurator for this configuration.
      var func = configurators[key];

      if (func)
        func (this._app, this._opts[key])
    }
  }

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
