'use strict';

var express     = require ('express')
  , debug       = require ('debug') ('blueprint:server')
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
  , util        = require ('util')
  , winston     = require ('winston')
  , Uploader    = require ('./Uploader')
  , env         = require ('./Environment').name
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

  console.log (util.format ('[%s]: listening on port %d', this.name, port));
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
function configureProtocols (configs, app, callback) {
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

  return callback (null, protocols);
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
    return callback (null, this);

  this._config = config || {};

  async.waterfall ([
    // Configure the middleware.
    function (callback) {
      this._configureMiddleware (callback);
    }.bind (this),

    // Configure the protocols
    function (callback) {
      configureProtocols (this._config.protocols, this._express, callback);
    }.bind (this),

    // Static middleware is the last middleware before any error handling middleware. This
    // ensures that dynamic routes take precedence over any static routes. The static routes
    // are in relation to the application path.
    function (protocols, callback) {
      this._protocols = protocols;

      if (!this._config.statics)
        return callback (null);

      async.each (this._config.statics, function (item, callback) {
        // Calculate the full path of the static path.
        const staticPath = path.isAbsolute (item) ? item : path.resolve (this._app.appPath, item);

        debug ('static path: ', staticPath);
        this._express.use (express.static (staticPath));

        return callback (null);
      }.bind (this), callback);
    }.bind (this),

    // Setup the views for the server, and the view engine. There can be a
    // single view engine, or there can be multiple view engines. The view
    // engine must be supported by consolidate.js.
    function (callback) {
      this._viewCachePath = path.resolve (this._app.appPath, VIEW_CACHE_PATH);
      this._express.set ('views', this._viewCachePath);

      if (this._config.view_engine)
        this._express.set ('view engine', this._config.view_engine);

      if (this._config.locals)
        this._express.locals = extend (true, this._express.locals, this._config.locals);

      async.parallel ([
        function (callback) {
          async.eachOf (this._config.engines, function (engine, key, callback) {
            this._express.engine (key, engine);

            return callback (null);
          }.bind (this), callback);
        }.bind (this),

        function (callback) {
          fse.ensureDir (this._viewCachePath, callback);
        }.bind (this),

        function (callback) {
          var uploadPath = path.resolve (this._app.appPath, UPLOAD_PATH);
          this._uploader = new Uploader ({dest: uploadPath});

          fse.ensureDir (uploadPath, callback);
        }.bind (this)
      ], callback);
    }.bind (this),

    function (result, callback) {
      this._express.use (this._mainRouter);
      return callback (null);
    }.bind (this)
  ], callback);
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

      debug (util.format ('bodyParser.%s: %s', key, bodyParserConfig[key]));
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
      debug ('cookie parser: ' + opts.cookies);

      var middleware = require ('cookie-parser');
      app.use (middleware (opts.cookies));
    },

    session : function (app, opts) {
      debug ('express session: ' + opts);

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

  return callback (null);
};

/**
 * Start listening for requests.
 *
 * @param done
 */
Server.prototype.listen = function (done) {
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
  debug ('importing views from ' + srcPath);

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
