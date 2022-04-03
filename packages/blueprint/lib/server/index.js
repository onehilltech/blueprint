/*
 * Copyright (c) 2018 One Hill Technologies, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { BO, computed } = require ('base-object');
const debug  = require ('debug') ('blueprint:server');
const assert = require ('assert');
const bodyParser  = require ('body-parser');
const consolidate = require ('consolidate');
const express = require ('express');
const path    = require ('path');
const klaw    = require ('klaw');
const handleError = require ('./handle-error');
const util = require ('util');
const BluebirdPromise = require ('bluebird');

const {
  merge,
  forOwn,
  forEach,
  difference,
  mapValues,
  omit
} = require ('lodash');

const Protocol = require ('./protocol');

const { ensureDir, copy } = require ('fs-extra');
const { env } = require ('../environment');
const defaultProtocols  = require ('./protocols');

const VIEW_CACHE_PATH = 'views';

/**
 * @class Server
 *
 * The main abstraction representing the server managed by the application.
 */
const Server = BO.extend ({
  /// The hosting application.
  app: null,

  /// List of engines loaded by the server.
  _engines: null,

  /// Name connections for the server.
  _connections: null,

  /// Collection of protocols supported by the server.
  _protocols: null,

  viewCachePath: computed ({
    get () {
      return path.resolve (this.app.tempPath, VIEW_CACHE_PATH);
    }
  }),

  express: computed ({
    get () { return this._express; }
  }),

  connections: computed ({
    get () { return this._connections; }
  }),

  protocols: computed ({
    get () { return this._protocols; }
  }),

  init () {
    this._super.call (this, ...arguments);

    assert (!!this.app, 'You must initialize the app property');

    this._express = express ();
    this._mainRouter = express.Router ();
    this._staticRouter = express.Router ();
    this._engines = [];
    this._connections = {};
    this._protocols = {};

    // Register the default protocols. We do not assign the protocols directly
    // to the protocols variable because we want to ensure the default protocols
    // have the expected interfaces.

    this._registerDefaultProtocols ();
  },

  _registerDefaultProtocols () {
    forOwn (defaultProtocols, (Protocol, name) => this.registerProtocol (name, Protocol));
  },

  /**
   * Configure the server.
   */
  configure (config = {}) {
    return new Promise (resolve => {
      // We always need to configure the middleware for the server, even if there
      // is no explicit middleware property in the configuration file.
      this._configureMiddleware (config.middleware);

      if (!!config.connections)
        this._configureConnections (config.connections);

      if (!!config.protocols)
        this._configureProtocols (config.protocols);

      /// Configure the static paths for the server.
      if (!!config.statics)
        this._configureStaticPaths (config.statics);

      resolve (this);
    }).then (server => server._finalizeConfigure (config))
      .then (() => Promise.resolve (this));
  },

  /**
   * Register a protocol with the server.
   *
   * @param name              Name of the protocol
   * @param protocol          Protocol class to register
   */
  registerProtocol (name, protocol) {
    assert (!this._protocols[name], `The ${name} protocol already exists.`);
    assert (protocol.isSubclassOf (Protocol), 'The protocol must extend the Protocol class.');
    assert (!!protocol.createProtocol, `The ${name} protocol class must implement the createProtocol(app, opts) static function.`);

    this._protocols[name] = protocol;
  },

  /**
   * Allow the server to start listening for connections.
   */
  listen () {
    return BluebirdPromise.props (mapValues (this._connections, (connection, name) => {
      debug (`${name}: listening...`);
      return connection.listen ();
    }));
  },

  /**
   * Close the server and all its connections.
   */
  close () {
    return BluebirdPromise.props (mapValues (this._connections, (connection, name) => {
      debug (`${name}: closing connection`);
      return connection.close ();
    }));
  },

  /**
   * Set the main router for the server.
   *
   * @param router
   */
  setMainRouter (router) {
    this._mainRouter.use (router);
  },

  _configureMiddleware (config = {}) {
    this._configureMorganMiddleware (config.morgan);

    const { defaultBodyParser = true } = config;
    this._configureBodyParserMiddleware (config.bodyParser, defaultBodyParser);

    this._configureValidatorsAndSanitizers ();
    this._configureOptionalMiddleware (config);
  },

  _configureMorganMiddleware (config = {}) {
    const morganConfig = merge ({
      format: (env === 'development' || env === 'test') ? 'dev' : 'combined',
      options: {}
    }, config);

    let {format, options} = morganConfig;

    const morgan = require ('morgan');
    const middleware = morgan (format, options);

    this._express.use (middleware);
  },

  _configureBodyParserMiddleware (config = {}, defaultBodyParser) {
    // Include backwards compatability with including the default body parsers that
    // always come with Blueprint. This will be removed in future versions since
    // the body parser will be defined at the router level, not the application level.

    const defaults = {
      json: {},
      urlencoded: {extended: false}
    };

    const bodyParserConfig = Object.assign ({},
      (defaultBodyParser ? defaults : {}),
      config.bodyParser);

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

    const {validators,sanitizers} = this.app.resources;
    const config = merge ({}, {customValidators: validators, customSanitizers: sanitizers});

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
        let middleware = require ('cookie-parser');
        debug ('configuring support for cookie-parser middleware');

        const {secret, options} = opts;
        app.use (middleware (secret, options));
      },

      session : function (app, opts) {
        debug ('configuring support for express-session middleware');

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
    if (!config.passport)
      return;

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
    this._connections = mapValues (config, (value, key) => {
      const Protocol = this._protocols[key];
      assert (!!Protocol, `${key} is not a valid protocol ${Object.keys (this._protocols)}`);

      return Protocol.createProtocol (this._express, value);
    });
  },

  /**
   * Configure the connections for the server.
   *
   * @param config
   * @private
   */
  _configureConnections (config) {
    this._connections = mapValues (config, (connection, name) => {

      // ECMAScript 2018: const { protocol, ...options } = connection;
      const { protocol } = connection;
      const options = omit (connection, ['protocol']);

      const Protocol = this._protocols[protocol];
      assert (!!Protocol, `${protocol} is not a valid protocol. The protocol must be one of the following: ${Object.keys (this._protocols)}`);

      debug (`configuring ${name} connection using the ${protocol} protocol`);
      return Protocol.createProtocol (this._express, options);
    });
  },

  _configureStaticPaths (config) {
    forEach (config, ( item) => {
      // Calculate the full path of the static path.
      const staticPath = path.isAbsolute (item) ? item : path.resolve (this.app.appPath, item);

      debug (`static path: ${staticPath}`);
      this._staticRouter.use (express.static (staticPath));
    });
  },

  /**
   * Import the views for use by the server.
   *
   * @param srcPath         Location of the view files.
   * @returns Promise
   */
  importViews (srcPath) {
    const options = { recursive: true, clobber: true };

    // We need to walk the import path to copy the files into the view cache
    // path and detect the different view engines. Ideally, we would like to
    // complete both in a single pass. This, however, would require implementing
    // an algorithm atop low-level functions since the copy functions do not let
    // us know what files are copies in real-time. Making two passes is basically
    // the same run-time complexity as a single pass. So, we are going to execute
    // both tasks in parallel.
    let promises = [];

    promises.push (copy (srcPath, this.viewCachePath, options));

    promises.push (new Promise ((resolve, reject) => {
      // Walk the path. For each view we find, we need to copy the file and
      // then create a view object of the file.
      let engines = [];

      klaw (srcPath).on ('data', item => {
        if (!item.stats.isFile ())
          return;

        // The extension of the file is used to determine the view engine.
        let ext = path.extname (item.path);

        if (ext.length > 1) {
          let engine = ext.slice (1);

          if (engines.indexOf (engine) === -1)
            engines.push (engine);
        }
      }).on ('end', () => {
        // Remove from the list the engines that we have already seen. We do
        // not want to replace the exiting renderer with the same renderer.
        let unloaded = difference (engines, this._engines);

        unloaded.forEach (ext => {
          let renderer = consolidate[ext];

          assert (!!renderer, `There is no view engine renderer for ${ext}`);

          this._express.engine (ext, renderer);
          this._engines.push (ext);
        });

        resolve (null);
      }).on ('error', reject);
    }));

    return Promise.all (promises);
  },

  _finalizeConfigure (config) {
    // The last thing we need to add to express is the main router. If the execution
    // reaches the main router, then that means all middleware before the main router
    // has authorized the request.
    this._express.use (this._mainRouter);
    this._express.use (this._staticRouter);
    this._express.use (handleError);

    // Set the location of the views, and configure the view engine.
    this._express.set ('views', this.viewCachePath);

    const {
      viewEngine,
      locals,
      engines
    } = config;

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
    let ensurePaths = [
      ensureDir (this.viewCachePath)
    ];

    return Promise.all (ensurePaths);
  }
});

Server.prototype._configureProtocols = util.deprecate (
  Server.prototype._configureProtocols,
  'app/configs/ server.js: protocols configuration property has been replaced by connections configuration property',
  'DEP0001');

module.exports = Server;

// individual exports
exports.Protocol = Protocol;
