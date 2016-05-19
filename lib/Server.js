var express     = require ('express')
  , winston     = require ('winston')
  , path        = require ('path')
  , extend      = require ('extend')
  , async       = require ('async')
  , consolidate = require ('consolidate')
  , fs          = require ('fs')
  , fse         = require ('fs-extra')
  // default middleware
  , morgan      = require ('morgan')
  , bodyParser  = require ('body-parser')
  , validator   = require ('express-validator')
  ;

var Path     = require ('./Path')
  , Uploader = require ('./Uploader')
  ;

var blueprint = require ('./index')
  ;

const VIEW_CACHE_PATH  = 'data/views';
const UPLOAD_PATH = 'data/uploads';

const DEFAULT_VIEW_ENGINE = 'pug';
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
      app.use (middleware.cookies (opts.cookies));
    },

    session : function (app, opts) {
      winston.log('debug', 'express session: %s', opts);
      app.use (middleware.session (opts));
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
function Server (appPath, config) {
  config = config || {};

  this._appPath = appPath;
  this._config = config;
  this._app = express ();
  this._protocols = [];

  // Configure the middleware for the Express.js application.
  configureMiddleware (this._app, config.middleware);
  this._protocols = configureProtocols (config.protocols, this._app);

  if (config.statics) {
    // Static middleware is the last middleware before any error handling middleware. This
    // ensures that dynamic routes take precedence over any static routes. The static routes
    // are in relation to the application path.
    var self = this;

    async.each(config.statics, function (iter, callback) {
      var staticPath = path.resolve (self._appPath, iter);
      winston.log ('debug', 'static path: ', staticPath);

      self._app.use (express.static (staticPath));
      return callback ();
    });
  }

  // Initialize the uploader for the server.
  var uploadPath = Path.resolve (appPath, UPLOAD_PATH);
  uploadPath.createIfNotExists ();
  this._uploader = new Uploader ({dest : uploadPath.path});

  // Setup the views for the server, and the view engine. There can be a
  // single view engine, or there can be multiple view engines. The view
  // engine must be supported by consolidate.js.
  this._viewCachePath = Path.resolve (this._appPath, VIEW_CACHE_PATH);
  this._viewCachePath.createIfNotExists ();

  this._app.set ('views', this._viewCachePath.path);

  var viewEngine = config['view_engine'] || DEFAULT_VIEW_ENGINE;
  this._app.set ('view engine', viewEngine);

  if (config['view_engines']) {
    // We are going to load multiple view engines in addition to the default
    // view engine for the server.
    var viewEngines = config['view_engines'];
    var length = viewEngines.length;

    for (var i = 0; i < length; ++ i) {
      var engine = viewEngines[i];
      this._app.engine (engine, consolidate[engine]);
    }
  }

  // Set the locals for the server application.
  if (config.locals)
    extend (true, this._app.locals, config.locals);
}

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
 * @param path
 */
Server.prototype.importViews = function (srcPath) {
  winston.log ('debug', 'importing views from %s', srcPath);

  var options = {
    recursive: true,
    preserveTimestamps: true,
  };

  fse.copySync (srcPath, this._viewCachePath.path, options);
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
  this._app.use (router);
};

Server.prototype.__defineGetter__ ('app', function () {
  return this._app;
});

module.exports = exports = Server;
