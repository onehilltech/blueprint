'use strict';

var express     = require ('express')
  , winston     = require ('winston')
  , path        = require ('path')
  , extend      = require ('extend')
  , async       = require ('async')
  , consolidate = require ('consolidate')
  , fse         = require ('fs-extra')
  , klaw        = require ('klaw')
  , morgan      = require ('morgan')
  , bodyParser  = require ('body-parser')
  , validator   = require ('express-validator')
  , _           = require ('underscore')
  , all         = require ('require-all')
  ;

var Path     = require ('./Path')
  , Uploader = require ('./Uploader')
  , env      = require ('./Environment').name
  ;

const VIEW_CACHE_PATH  = 'temp/views';
const UPLOAD_PATH = 'temp/uploads';

const DEFAULT_HTTP_PORT = 5000;

module.exports = Server;

/**
 * @class Protocol
 */
function Protocol (name, server, port) {
  this.name = name;
  this._server = server;
  this.port = port;
}

/**
 * Instruct the protocol to start listening for events.
 *
 * @param port
 * @param callback
 */
Protocol.prototype.listen = function (port, callback) {
  if (!callback)
    callback = port;

  if (_.isFunction (port))
    port = this.port;

  port = port || this.port;

  winston.log ('info', '[%s]: listening on port %d...', this.name, port);
  this._server.listen (port, callback);
};

Protocol.prototype.__defineGetter__ ('server', function () {
  return this._server;
});

/**
 * Private function to configure the protocols based on the configuration.
 *
 * @param configs
 * @param app
 * @returns {Array}
 */
function configureProtocols (configs, app) {
  var configurators = {
    http  : function (opts, app) {
      var server = require ('http').createServer (app);
      var port = opts.port || 80;

      return new Protocol ('http', server, port);
    },

    https : function (opts, app) {
      var server = require ('https').createServer (opts.options, app);
      var port = opts.port || 443;

      return new Protocol ('https', server, port);
    }
  };

  // Get a default configuration for the protocols. Otherwise, we are going to
  // require all servers to define the same default configuration.
  configs = configs || {
      http: {
        port: DEFAULT_HTTP_PORT
      }
    };

  var protocols = [];

  for (var protocolType in configs) {
    if (configs.hasOwnProperty (protocolType)) {
      var configurator = configurators[protocolType];

      if (!configurator)
        throw new Error ('Unsupported protocol: ' + protocolType);

      protocols.push (configurator (configs[protocolType], app));
    }
  }

  return protocols;
}

/**
 * @class Server
 *
 * Server abstraction that integrates an Express.js application with the
 * protocols for handling events over the network.
 *
 * @param app     Framework application
 * @constructor
 */
function Server (app) {
  this._app = app;
  this._express = express ();
  this._mainRouter = express.Router ();
  this._protocols = [];
  this._engines = [];
}

/**
 * Configure the server.
 *
 * @param config
 * @param callback
 */
Server.prototype.configure = function (config, callback) {
  if (this._config)
    return callback (new Error ('Server already configured'));

  config = config || {};

  this._config = config;

  async.waterfall ([
    async.constant (this),

    // Configure the middleware.
    function (server, callback) {
      server._configureMiddleware (callback);
    },

    // Configure the protocols.
    function (server, callback) {
      server._protocols = configureProtocols (config.protocols, server._express);
      return callback (null, server);
    },

    // Static middleware is the last middleware before any error handling middleware. This
    // ensures that dynamic routes take precedence over any static routes. The static routes
    // are in relation to the application path.

    function (server, callback) {
      if (!config.statics)
        return callback (null, server);

      async.each (config.statics, function (item, callback) {
        var staticPath = path.isAbsolute (item) ? item : path.resolve (server._app.appPath, item);
        winston.log ('debug', 'static path: ', staticPath);

        server._express.use (express.static (staticPath));

        return callback ();
      }, function (err) {
        return callback (err, server);
      });
    },

    // Setup the views for the server, and the view engine. There can be a
    // single view engine, or there can be multiple view engines. The view
    // engine must be supported by consolidate.js.
    function (server, callback) {
      server._viewCachePath = path.resolve (server._app.appPath, VIEW_CACHE_PATH);
      server._express.set ('views', server._viewCachePath);

      if (config.view_engine)
        server._express.set ('view engine', config.view_engine);

      if (config.engines) {
        // Install the custom engine handlers.
        for (var key in config.engines) {
          if (!config.engines.hasOwnProperty (key))
            continue;

          var engine = config.engines[key];
          server._express.engine (key, engine);
        }
      }

      fse.ensureDir (server._viewCachePath, function (err) {
        return callback (err, server);
      });
    },

    // Set the locals for the server application.
    function (server, callback) {
      if (config.locals)
        server._express.locals = extend (true, server._express.locals, config.locals);

      return callback (null, server)
    },

    // Setup the upload path for the server.
    function (server, callback) {
      var uploadPath = Path.resolve (server._app.appPath, UPLOAD_PATH);

      uploadPath.createIfNotExists (function (err) {
        if (err) return callback (err);

        server._uploader = new Uploader ({dest: uploadPath.path});
        return callback (null, server);
      });
    }
  ], function (err, server) {
    if (server)
      server._express.use (server._mainRouter);

    return callback (err, server);
  });
};

/**
 * Configure the middleware for the application.
 */
Server.prototype._configureMiddleware = function (callback) {
  var config = this._config.middleware || {};

  // First, install the morgan middleware. It is important that the first
  // middleware to handle the event is the logging middleware.
  var morganConfig = config.morgan || { };

  if (!morganConfig.format)
    morganConfig.format = (env === 'development' || env === 'test') ? 'dev' : 'combined';

  this._express.use (morgan (morganConfig.format, morganConfig.options));

  // Next, we need to parse the body of the message, if present. This will
  // transform from a string into an actionable object. By default, we are
  // enabling both URL encoded and JSON formats.
  var bodyParserConfig = config.bodyParser || { json: {}, urlencoded: {extended: false} };

  for (var key in bodyParserConfig) {
    if (bodyParserConfig.hasOwnProperty(key)) {
      var middleware = bodyParser[key];

      if (!middleware)
        throw new Error (util.format ('%s is an unsupported middleware type', key));

      winston.log ('debug', 'bodyParser.%s: %s', key, bodyParserConfig[key]);
      this._express.use (middleware.call (bodyParser, bodyParserConfig[key]));
    }
  }

  // Now, add validation to the middleware stack. We can validate the request
  // since the body has been parsed.
  var validatorConfig = config.validator || {};
  validatorConfig.customValidators = validatorConfig.customValidators || {};
  validatorConfig.customSanitizers = validatorConfig.customSanitizers || {};

  extend (validatorConfig.customValidators, this._app.validators);
  extend (validatorConfig.customSanitizers, this._app.sanitizers);
  this._express.use (validator (validatorConfig));

  // Configure the optional middleware for the server. Some of the middleware
  // is required. Some of the middleware is optional. For the middleware that is
  // required, we provide default options if no options are provided. For the
  // middleware that is optional, it is only included in the server if options
  // are provided for it.
  var optionalMiddleware = {
    cookies : function (app, opts) {
      winston.log('debug', 'cookie parser: %s', opts.cookies);
      var middleware = require ('cookie-parser');

      app.use (middleware (opts.cookies));
    },

    session : function (app, opts) {
      winston.log('debug', 'express session: %s', opts);
      var middleware = require ('express-session');

      app.use (middleware (opts));
    }
  };

  for (key in config) {
    if (config.hasOwnProperty (key)) {
      // Locate the configurator for this configuration.
      var configurator = optionalMiddleware[key];

      if (configurator)
        configurator (this._express, config[key])
    }
  }

  // Make sure that Passport is configured as the last optioanl out-of-the-box
  // middleware. It has to come after both session and cookies for it to work
  // correctly.

  if (config.passport) {
    var passport = require ('passport');
    this._express.use (passport.initialize ());

    if (config.passport.session) {
      if (!config.session)
        throw new Error ('Server must enable sessions to use passport-sessions');

      // Configure the Express application to use passport sessions.
      this._express.use (passport.session ());

      // Configure Passport to serialize and deserialize user sessions.
      passport.serializeUser (config.passport.session.serializer);
      passport.deserializeUser (config.passport.session.deserializer);
    }
  }

  // Add the custom middleware to the end.
  if (config.custom)
    this._express.use (config.custom);

  return callback (null, this);
};

/**
 * Start listening for requests.
 *
 * @param listenCallback
 * @param done
 */
Server.prototype.listen = function (done) {
  if (this._protocols.length === 0)
    winston.log ('warn', 'server has no protocols; cannot receive any requests');

  async.each (this._protocols, function (protocol, callback) {
    protocol.listen (callback);
  }, done);
};

/**
 * Import views from a path. This allows the views in the specified path to be
 * be used in the render() method by controllers.
 *
 * @param srcPath       Directory to import view from
 * @param callback      Completion callback
 */
Server.prototype.importViews = function (srcPath, callback) {
  winston.log ('debug', 'importing views from %s', srcPath);

  // We need to walk the import path to copy the files into the view cache
  // path and detect the different view engines. Ideally, we would like to
  // complete both in a single pass. This, however, would require implementing
  // an algorithm atop low-level functions since the copy functions do not let
  // us know what files are copies in real-time. Making two passes is basically
  // the same run-time complexity as a single pass. So, we are going to execute
  // both tasks in parallel.
  var self = this;

  async.parallel ([
    function (callback) {
      // Walk the path. For each view we find, we need to copy the file and then
      // create a view object of the file.
      var options = { recursive: true, clobber: true };
      fse.copy (srcPath, self._viewCachePath, options, callback);
    },

    function (callback) {
      var engines = [];

      klaw (srcPath)
        .on ('data', data)
        .on ('end', end);

      function data (item) {
        if (item.stats.isFile ()) {
          // The extension of the file is used to determine the view engine.
          var ext = path.extname (item.path);

          if (ext.length > 1) {
            var engine = ext.slice (1);

            if (engines.indexOf (engine) === -1)
              engines.push (engine);
          }
        }
      }

      function end () {
        // Remove the custom engines from the list.
        if (self._config.engines)
          engines = _.difference (engines, Object.keys (self._config[engines]))

        async.each (engines, function (ext, callback) {
          // There is no need to load the engine more than once.
          if (self._engines.indexOf (ext) !== -1)
            return callback (null);

          var render = consolidate[ext];

          if (render) {
            self._express.engine (ext, render);
            self._engines.push (ext);
          }
          else {
            winston.log ('warn', '%s is an unsupported view extension', ext);
          }

          return callback ();
        }, callback);
      }
    }
  ], callback);
};

/**
 * Get the middleware for the server. The available middleware is defined in
 * the server.config.js file.
 */
Server.prototype.__defineGetter__ ('middleware', function () {
  return this._middleware;
});

Server.prototype.__defineGetter__ ('upload', function () {
  return this._uploader;
});

Server.prototype.__defineGetter__ ('protocols', function () {
  return this._protocols
});

/**
 * Set the main router for the server.
 *
 * @param router
 */
Server.prototype.setMainRouter = function (router) {
  this._mainRouter.use (router);
};

Server.prototype.__defineGetter__ ('app', function () {
  return this._express;
});
