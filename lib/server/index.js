const Object = require ('../object');
const debug  = require ('debug') ('blueprint:server');
const assert = require ('assert');

const {
  merge,
  forOwn,
  forEach,
} = require ('lodash');

const {
  env
} = require ('../environment');

const express = require ('express');
const async   = require ('async');
const path    = require ('path');

const {
  ensureDir
} = require ('fs-extra');

const Uploader   = require ('./uploader');
const protocols  = require ('./protocols');
const bodyParser = require ('body-parser');

const VIEW_CACHE_PATH  = 'views';
const UPLOAD_PATH = 'uploads';

/**
 * @class Server
 *
 * The main abstraction representing the server managed by the application.
 */
module.exports = Object.extend ({
  /// The hosting application.
  app: null,

  /// Collection of protocols loaded into server.
  _protocols: {},

  /// Template engines used by the server.
  _engines: [],

  init () {
    this._super.init.apply (this, arguments);

    assert (!!this.app, 'You must initialize the app property');

    this._express = express ();
    this._mainRouter = express.Router ();
  },

  /**
   * Configure the server.
   */
  configure (config) {
    return this._configureMiddleware (config).then ((server) => {
      return server._configureProtocols (config);
    }).then ((server) => {
      return server._configureStaticPaths (config);
    }).then ((server) => {
      return server._configureViews (config);
    }).then ((server) => {
      return server._finalizeConfigure (config);
    });
  },

  /**
   * Allow the server to start listening for connections.
   */
  listen () {
    let promises = [];

    for (let i = 0, len = this._protocols.length; i < len; ++ i)
      promises.push (this._protocols[i].listen ());

    return Promise.all (promises);
  },

  /**
   * Close the server and all its connections.
   */
  close () {
    let promises = [];

    for (let i = 0, len = this._protocols.length; i < len; ++ i)
      promises.push (this._protocols[i].close ());

    return Promise.all (promises);
  },

  /**
   * Set the main router for the server.
   *
   * @param router
   */
  setMainRouter (router) {
    this._mainRouter.use (router);
  },

  _configureMiddleware (config) {
    const middleware = config.middleware || {};

    return new Promise ((resolve) => {
      this._configureMorganMiddleware (middleware.morgan);
      this._configureBodyParserMiddleware (config.bodyParser);
      this._configureValidatorsAndSanitizers ();
      this._configureOptionalMiddleware (config);

      resolve (this);
    });
  },

  _configureMorganMiddleware (config = {}) {
    const morganConfig = merge ({
      format: (env === 'development' || env === 'test') ? 'dev' : 'combined',
      options: {}
    }, config);

    let {format,options} = morganConfig;
    const morgan = require ('morgan');
    const middleware = morgan (format, options);

    this._express.use (middleware);
  },

  _configureBodyParserMiddleware (config = {}) {
    let bodyParserConfig = merge ({
      json: {},
      urlencoded: {extended: false}
    }, config.bodyParser);

    forOwn (bodyParserConfig, (config, type) => {
      let middleware = bodyParser[type];

      assert (!!middleware, `${type} is an unsupported bodyParser type`);

      debug (`bodyParser.${type}: ${config}`);
      this._express.use (middleware.call (bodyParser, config));
    });
  },

  _configureValidatorsAndSanitizers () {
    // Load the validators and sanitizers.
    const validator = require ('express-validator');

    const {validators,sanitizers} = this.app;
    const config = merge ({}, validators, sanitizers);

    this._express.use (validator (config));
  },

  _configureOptionalMiddleware (config) {
    // Configure the optional middleware for the server. Some of the middleware
    // is required. Some of the middleware is optional. For the middleware that is
    // required, we provide default options if no options are provided. For the
    // middleware that is optional, it is only included in the server if options
    // are provided for it.
    const optional = {
      cookies : function (app, opts) {
        debug ('cookie parser: ' + opts.cookies);

        let middleware = require ('cookie-parser');
        app.use (middleware (opts.cookies));
      },

      session : function (app, opts) {
        debug ('express session: ' + opts);

        let middleware = require ('express-session');
        app.use (middleware (opts));
      }
    };

    forOwn (optional, (configurator, name) => {
      let optionalConfig = config[name];

      if (optionalConfig)
        configurator (this._express, optionalConfig);
    });

    // Make sure that Passport is configured as the last optional out-of-the-box
    // middleware. It has to come after both session and cookies for it to work
    // correctly.

    if (config.passport)
      this._configurePassport (config);

    // Add the custom middleware to the end.
    if (config.custom)
      this._express.use (config.custom);
  },

  _configurePassport (config) {
    const passport = require ('passport');
    this._express.use (passport.initialize ());

    if (config.passport.session) {
      if (!config.session)
        throw new Error ('Server must enable session middleware to use passport-sessions');

      // Configure the Express application to use passport sessions.
      this._express.use (passport.session ());

      // Configure Passport to serialize and deserialize user sessions.
      passport.serializeUser (config.passport.session.serializer);
      passport.deserializeUser (config.passport.session.deserializer);
    }
  },

  /**
   * Configure the protocols for the server.
   * 
   * @param config
   * @returns {Promise<any>}
   * @private
   */
  _configureProtocols (config) {
    return new Promise ((resolve) => {
      forOwn (config.protocols, (value, key) => {
        const Protocol = protocols[key];

        assert (Protocol, `${key} is an invalid protocol`);
        assert (Protocol.createProtocol, `${key} must define createProtocol() static method`);

        this._protocols[key] = Protocol.createProtocol (this._express, value);
      });

      resolve (this);
    });
  },

  _configureStaticPaths (config) {
    return new Promise ((resolve) => {
      forEach (config.statics, (item) => {
        // Calculate the full path of the static path.
        const staticPath = path.isAbsolute (item) ? item : path.resolve (this.app.appPath, item);

        debug (`static path: ${staticPath}`);
        this._express.use (express.static (staticPath));
      });

      resolve (this);
    });
  },

  _configureViews (config) {
    return new Promise ((resolve) => {
      resolve (this);
    });
  },

  _finalizeConfigure (config) {
    return new Promise ((resolve, reject) => {
      // The last thing we need to add to express is the main router. If the execution
      // reaches the main router, then that means all middleware before the main router
      // has authorized the request.
      this._express.use (this._mainRouter);

      // Set the location of the views, and configure the view engine.
      let {tempPath} = this.app;

      this._viewCachePath = path.resolve (tempPath, VIEW_CACHE_PATH);
      this._express.set ('views', this._viewCachePath);

      const {viewEngine,locals,engines} = config;

      // Define the default view engine, if one exists.
      if (viewEngine)
        this._express.set ('view engine', viewEngine);

      // Add the locals to the a
      if (locals)
        merge (this._express.locals, locals);

      // Update the express view engines with the ones that are explicitly defined. This
      // is not the same as the ones that are automatically detected from the extensions
      // of all the views in the /views directory.
      forEach (engines, (engine, ext) => { this._express.engine (ext, engine) });

      // Make sure the view cache path exists.
      ensureDir (this._viewCachePath).then (() => {
        const uploadPath = path.resolve (tempPath, UPLOAD_PATH);
        this._uploader = new Uploader ({dest: uploadPath});

        return ensureDir (uploadPath);
      }).then (() => resolve (this));
    });
  }
});
