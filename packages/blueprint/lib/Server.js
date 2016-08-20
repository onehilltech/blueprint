var express = require ('express')
  , winston = require ('winston')
  , path = require ('path')
  , extend = require ('extend')
  , async = require ('async')
  , consolidate = require ('consolidate')
  , fse = require ('fs-extra')
  , _ = require ('underscore')
// default middleware
  , morgan = require ('morgan')
  , bodyParser = require ('body-parser')
  , validator = require ('express-validator')
  ;

var Path     = require ('./Path')
  , Uploader = require ('./Uploader')
  ;

var blueprint = require ('./index')
  ;

const VIEW_CACHE_PATH  = 'temp/views';
const UPLOAD_PATH = 'temp/uploads';

const DEFAULT_HTTP_PORT = 5000;

/**
 * Configure the middleware for the application.
 *
 * @param app
 * @param config
 */
function configureMiddleware (app, config) {
  config = config || {};
  
  // First, install the morgan middleware. It is important that the first
  // middleware to handle the event is the logging middleware.
  var morganConfig = config.morgan || { };
  var env = blueprint.env;

  if (!morganConfig.format)
    morganConfig.format = (env === 'development' || env === 'test') ? 'dev' : 'combined';

  app.use (morgan (morganConfig.format, morganConfig.options));

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
      app.use (middleware.call (bodyParser, bodyParserConfig[key]));
    }
  }

  // Now, add validation to the middleware stack. We can validate the request
  // since the body has been parsed.
  var validatorConfig = config.validator || {};
  app.use (validator (validatorConfig));

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
        configurator (app, config[key])
    }
  }

  // Make sure that Passport is configured as the last optioanl out-of-the-box
  // middleware. It has to come after both session and cookies for it to work
  // correctly.

  if (config.passport) {
    var passport = require ('passport');
    app.use (passport.initialize ());

    if (config.passport.session) {
      if (!config.session)
        throw new Error ('Server must enable sessions to use passport-sessions');

      // Configure the Express application to use passport sessions.
      app.use (passport.session ());

      // Configure Passport to serialize and deserialize user sessions.
      passport.serializeUser (config.passport.session.serializer);
      passport.deserializeUser (config.passport.session.deserializer);
    }
  }

  // Add the custom middleware to the end.
  if (config.custom)
    app.use (config.custom);
}

/**
 * @class Protocol
 *
 * @param protocol
 * @param port
 * @constructor
 */
function Protocol (name, protocol, port) {
  this._name = name;
  this._protocol = protocol;
  this._port = port;
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

  if (typeof port === 'function')
    port = this._port;

  port = port || this._port;

  winston.log ('info', '[%s]: listening on port %d...', this._name, port);
  this._protocol.listen (port, callback);
};

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
      var protocol = require ('http').createServer (app);
      var port = opts.port || 80;

      return new Protocol ('http', protocol, port);
    },

    https : function (opts, app) {
      var protocol = require ('https').createServer (opts.options, app);
      var port = opts.port || 443;

      return new Protocol ('https', protocol, port);
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
 * @param appPath     Path to the application directory
 * @param config      Server configuration
 * @constructor
 */
function Server (appPath) {
  this._appPath = appPath;
  this._app = express ();
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
      configureMiddleware (server._app, config.middleware);
      return callback (null, server);
    },

    // Configure the protocols.
    function (server, callback) {
      server._protocols = configureProtocols (config.protocols, server._app);
      return callback (null, server);
    },

    // Static middleware is the last middleware before any error handling middleware. This
    // ensures that dynamic routes take precedence over any static routes. The static routes
    // are in relation to the application path.

    function (server, callback) {
      if (!config.statics)
        return callback (null, server);

      async.each (config.statics, function (iter, callback) {
        var staticPath = path.resolve (server._appPath, iter);
        winston.log ('debug', 'static path: ', staticPath);

        server._app.use (express.static (staticPath));

        return callback ();
      }, function (err) {
        return callback (err, server);
      });
    },

    // Setup the views for the server, and the view engine. There can be a
    // single view engine, or there can be multiple view engines. The view
    // engine must be supported by consolidate.js.
    function (server, callback) {
      var viewCachePath = Path.resolve (server._appPath, VIEW_CACHE_PATH);

      viewCachePath.createIfNotExists (function (err) {
        if (err) return callback (err);

        server._viewCachePath = viewCachePath.path;
        server._app.set ('views', viewCachePath.path);

        // Set the default view engine. We learn what view engines to set on the
        // server during the view import phase.

        if (config['view_engine'])
          server._app.set ('view engine', config['view_engine']);

        return callback (null, server);
      });
    },

    // Set the locals for the server application.
    function (server, callback) {
      if (config.locals)
        server._app.locals = extend (true, server._app.locals, config.locals);

      return callback (null, server)
    },

    // Setup the upload path for the server.
    function (server, callback) {
      var uploadPath = Path.resolve (server._appPath, UPLOAD_PATH);

      uploadPath.createIfNotExists (function (err) {
        if (err) return callback (err);

        server._uploader = new Uploader ({dest: uploadPath.path});
        return callback (null, server);
      });
    }
  ], function (err, server) {
    if (server)
      server._app.use (server._mainRouter);

    return callback (err, server);
  });
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

      fse.walk (srcPath)
        .on ('data', function (item) {
          if (item.stats.isFile ()) {
            // The extension of the file is used to determine the view engine.
            var ext = path.extname (item.path);

            if (ext.length > 1) {
              var engine = ext.slice (1);

              if (engines.indexOf (engine) === -1)
                engines.push (engine);
            }
          }
        })
        .on ('end', function () {
          async.each (engines, function (ext, callback) {
            // There is no need to load the engine more than once.
            if (self._engines.indexOf (ext) !== -1)
              return callback (null);

            var render = consolidate[ext];

            if (render) {
              self._app.engine (ext, render);
              self._engines.push (ext);
            }
            else {
              winston.log ('warn', '%s is an unsupported view extension', ext);
            }

            return callback ();
          }, callback);
        });
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

/**
 * Set the main router for the server.
 *
 * @param router
 */
Server.prototype.setMainRouter = function (router) {
  this._mainRouter.use (router);
};

Server.prototype.__defineGetter__ ('app', function () {
  return this._app;
});

module.exports = exports = Server;
