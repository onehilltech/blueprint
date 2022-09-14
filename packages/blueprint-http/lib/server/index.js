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

const { env } = require ('@onehilltech/blueprint');
const debug  = require ('debug') ('blueprint-http:server');
const assert = require ('assert');
const bodyParser  = require ('body-parser');
const consolidate = require ('consolidate');
const express = require ('express');
const path = require ('path');
const handleError = require ('./handle-error');

const { merge, forOwn, forEach, map, defaultsDeep } = require ('lodash');

const { env } = require ('@onehilltech/blueprint');

const Protocol = require ('./protocol');
const defaultProtocols  = require ('./protocols');

/**
 * @class Server
 *
 * The main abstraction representing the server managed by the application.
 */
module.exports = exports = class Server {
  constructor (app) {
    Object.defineProperty (this, 'app', { writable: false, value: app, configurable: false });
    Object.defineProperty (this, 'protocols', { writable: false, value: { }, configurable: false });
    Object.defineProperty (this, 'connections', { writable: false, value: { }, configurable: false });
    Object.defineProperty (this, '_express', { writable: false, value: express () });

    this._mainRouter = express.Router ();
    this._staticRouter = express.Router ();
    this._engines = [];

    // Register the default protocols. We do not assign the protocols directly
    // to the protocols variable because we want to ensure the default protocols
    // have the expected interfaces.
    this._registerDefaultProtocols ();
  }

  get viewsPath () {
    return path.resolve (this.app.tempPath, 'resources/views');
  }

  /**
   * Helper method that register the default protocols
   *
   * @private
   */
  _registerDefaultProtocols () {
    forOwn (defaultProtocols, (Protocol, name) => this.registerProtocol (name, Protocol));
  }

  /**
   * Configure the server.
   */
  async configure (config = {}) {
    if (env === 'production' || env === 'sandbox') {
      this._express.set ('trust proxy', 'loopback')
    }

    // We always need to configure the middleware for the server, even if there
    // is no explicit middleware property in the configuration file.
    this._configureMiddleware (config.middleware);

    if (!!config.connections)
      this._configureConnections (config.connections);

    /// Configure the static paths for the server.
    if (!!config.statics)
      this._configureStaticPaths (config.statics);

    await this._finalizeConfigure (config);

    return this;
  }

  /**
   * Register a protocol with the server.
   *
   * @param name              Name of the protocol
   * @param protocol          Protocol class to register
   */
  registerProtocol (name, protocol) {
    assert (!this.protocols[name], `The ${name} protocol already exists.`);
    assert (!!protocol.createProtocol, `The ${name} protocol class must implement the createProtocol(app, opts) static function.`);

    this.protocols[name] = protocol;
  }

  /**
   * Allow the server to start listening for connections.
   */
  listen () {
    const promises = map (this.connections, (connection, name) => {
      debug (`${name}: listening...`);
      return connection.listen ();
    });

    return Promise.all (promises);
  }

  /**
   * Close the server and all its connections.
   */
  close () {
    const promises = map (this.connections, (connection, name) => {
      debug (`${name}: closing connection`);
      return connection.close ();
    });

    return Promise.all (promises);
  }

  /**
   * Set the main router for the server.
   *
   * @param router
   */
  setMainRouter (router) {
    this._mainRouter.use (router);
  }

  /**
   * Configure the middleware for the server.
   * *
   * @param config          Middleware configuration
   * @private
   */
  _configureMiddleware (config = {}) {
    this._configureMorganMiddleware (config.morgan);

    const { defaultBodyParser = true } = config;
    this._configureBodyParserMiddleware (config.bodyParser, defaultBodyParser);
    this._configureOptionalMiddleware (config);
  }

  /**
   * Configure the morgan middleware.
   * @param config
   * @private
   */
  _configureMorganMiddleware (config = {}) {
    const morganConfig = defaultsDeep (config,{
      format: (env === 'development' || env === 'test') ? 'dev' : 'combined',
      options: { }
    });

    const { format, options } = morganConfig;

    const morgan = require ('morgan');
    const middleware = morgan (format, options);

    this._express.use (middleware);
  }

  /**
   * Helper method to configure the body parser middleware.
   *
   * @param config
   * @param defaultBodyParser
   * @private
   */
  _configureBodyParserMiddleware (config = {}, defaultBodyParser) {
    // Include backwards compatability with including the default body parsers that
    // always come with Blueprint. This will be removed in future versions since
    // the body parser will be defined at the router level, not the application level.

    const defaults = {
      json: {},
      urlencoded: {extended: false}
    };

    const bodyParserConfig = defaultsDeep (config.bodyParser, (defaultBodyParser ? defaults : {}));

    forOwn (bodyParserConfig, (config, type) => {
      const middleware = bodyParser[type];

      assert (!!middleware, `${type} is an unsupported bodyParser type`);

      debug (`bodyParser.${type}: ${config}`);
      this._express.use (middleware.call (bodyParser, config));
    });
  }

  _configureOptionalMiddleware (config) {
    // Configure the optional middleware for the server. Some of the middleware
    // is required. Some of the middleware is optional. For the middleware that is
    // required, we provide default options if no options are provided. For the
    // middleware that is optional, it is only included in the server if options
    // are provided for it.
    const optional = {
      cookies : function (app, opts) {
        const middleware = require ('cookie-parser');
        debug ('configuring support for cookie-parser middleware');

        const { secret, options } = opts;
        app.use (middleware (secret, options));
      },

      session : function (app, opts) {
        debug ('configuring support for express-session middleware');

        const middleware = require ('express-session');
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
  }

  /**
   * Configure the passport middleware.
   *
   * @param config
   * @private
   */
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
  }

  /**
   * Configure the connections for the server.
   *
   * @param config
   * @private
   */
  _configureConnections (config) {
    forEach (config, (connection, name) => {
      const { protocol, ...options } = connection;
      const Protocol = this.protocols[protocol];
      assert (!!Protocol, `${protocol} is not a valid protocol. The protocol must be one of the following: ${Object.keys (this.protocols)}`);

      debug (`configuring ${name} connection using the ${protocol} protocol`);
      this.connections[name] = Protocol.createProtocol (this._express, options);
    });
  }

  /**
   * Configure the static paths
   *
   * @param config
   * @private
   */
  _configureStaticPaths (config) {
    forEach (config, (item) => {
      // Calculate the full path of the static path.
      const staticPath = path.isAbsolute (item) ? item : path.resolve (this.app.appPath, item);

      debug (`static path: ${staticPath}`);
      this._staticRouter.use (express.static (staticPath));
    });
  }

  _finalizeConfigure (config) {
    // The last thing we need to add to express is the main router. If the execution
    // reaches the main router, then that means all middleware before the main router
    // has authorized the request.
    this._express.use (this._mainRouter);
    this._express.use (this._staticRouter);
    this._express.use (handleError);

    // Set the location of the views, and configure the view engine.
    this._express.set ('views', this.viewsPath);

    const { viewEngine, locals, engines } = config;

    // Define the default view engine, if one exists.
    if (viewEngine)
      this._express.set ('view engine', viewEngine);

    // Add the locals to the express application.
    if (locals)
      merge (this._express.locals, locals);

    // Update the express view engines with the ones that are explicitly defined. This
    // is not the same as the ones that are automatically detected from the extensions
    // of all the views in the /views directory.
    forEach (engines, (engine, ext) => { this._express.engine (ext, engine) });
  }
}

// individual exports
exports.Protocol = Protocol;
