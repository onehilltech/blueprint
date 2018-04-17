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

const BlueprintObject = require ('../object');
const debug  = require ('debug') ('blueprint:server');
const assert = require ('assert');
const bodyParser  = require ('body-parser');
const consolidate = require ('consolidate');
const express = require ('express');
const path    = require ('path');
const klaw    = require ('klaw');
const handleError = require ('./handle-error');

const {computed} = require ('../properties');

const {
  merge,
  forOwn,
  forEach,
  difference
} = require ('lodash');

const {
  ensureDir,
  copy
} = require ('fs-extra');

const {
  env
} = require ('../environment');

const protocols  = require ('./protocols');

const VIEW_CACHE_PATH = 'views';
const UPLOAD_PATH = 'uploads';

/**
 * @class Server
 *
 * The main abstraction representing the server managed by the application.
 */
module.exports = BlueprintObject.extend ({
  /// The hosting application.
  app: null,

  /// Collection of protocols loaded into server.
  _protocols: null,

  /// List of engines loaded by the server.
  _engines: null,

  express: computed ({
    get () { return this._express; }
  }),

  init () {
    this._super.call (this, ...arguments);

    assert (!!this.app, 'You must initialize the app property');

    this._express = express ();
    this._mainRouter = express.Router ();
    this._engines = [];
    this._protocols = {};
  },

  /**
   * Configure the server.
   */
  configure (config = {}) {
    return new Promise (resolve => {
      this._configureMiddleware (config);
      this._configureProtocols (config);
      this._configureStaticPaths (config);
      resolve (null);
    }).then (() => this._finalizeConfigure (config))
      .then (() => Promise.resolve (this));
  },

  /**
   * Allow the server to start listening for connections.
   */
  listen () {
    let promises = [];

    forOwn (this._protocols, (protocol, key) => {
      debug (`${key}: listening...`);
      promises.push (protocol.listen ());
    });

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

    this._configureMorganMiddleware (middleware.morgan);
    this._configureBodyParserMiddleware (config.bodyParser);
    this._configureValidatorsAndSanitizers ();
    this._configureOptionalMiddleware (config);
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
    forOwn (config.protocols, (value, key) => {
      const Protocol = protocols[key];

      assert (Protocol, `${key} is an invalid protocol`);
      assert (Protocol.createProtocol, `${key} must define createProtocol() static method`);

      this._protocols[key] = Protocol.createProtocol (this._express, value);
    });
  },

  _configureStaticPaths (config) {
    forEach (config.statics, (item) => {
      // Calculate the full path of the static path.
      const staticPath = path.isAbsolute (item) ? item : path.resolve (this.app.appPath, item);

      debug (`static path: ${staticPath}`);
      this._express.use (express.static (staticPath));
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

    promises.push (copy (srcPath, this._viewCachePath, options));
    
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
    this._express.use (handleError);

    // Set the location of the views, and configure the view engine.
    let {tempPath} = this.app;

    this._viewCachePath = path.resolve (tempPath, VIEW_CACHE_PATH);
    this._express.set ('views', this._viewCachePath);

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
    const uploadPath = path.resolve (tempPath, UPLOAD_PATH);

    let ensurePaths = [
      ensureDir (this._viewCachePath),
      ensureDir (uploadPath)
    ];

    return Promise.all (ensurePaths);
  }
});
