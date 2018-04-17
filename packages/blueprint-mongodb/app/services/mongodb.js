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

const {
  Service,
  computed
} = require ('@onehilltech/blueprint');

const {
  forOwn,
  mapValues,
  get
} = require ('lodash');

const BluebirdPromise = require ('bluebird');

const mongoose = require ('mongoose');
const debug = require ('debug')('blueprint-mongodb:mongodb');

const DEFAULT_CONNECTION_NAME = '$default';

mongoose.Promise = Promise;

/**
 * @class MongoDbService
 */
module.exports = Service.extend ({
  /// Named connections managed by the service.
  _connections: null,

  /// The application start barrier.
  _appStart: null,

  defaultConnection: computed ({
    get () { return this._connections[this._defaultName]; }
  }),

  connections: computed ({
    get () { return this._connections; }
  }),

  init () {
    this._super.apply (this, arguments);
    this._connections = {};

    // setup the messaging.
    this.app.on ('blueprint.app.starting', this.openConnections.bind (this));

    this._loadConfiguration ();
  },

  _loadConfiguration () {
    // Locate the module configuration in the application. If there is no
    // configuration, then we need to stop processing. This brings attention
    // to the developer to resolve the problem.

    this.config = this.get ('app.configs.mongodb');

    if (!this.config)
      throw new Error ('The application does not define a mongodb configuration.');

    this._defaultName = get (this.config, 'defaultConnection', DEFAULT_CONNECTION_NAME);
    const {connections} = this.config;

    if (!connections || connections.length === 0)
      throw new Error ('You must define at least 1 connection in the configuration.');

    if (!connections[this._defaultName])
      throw new Error ('The default connection configuration is not defined.');

    // Capture the default connection in mongoose, which is always the
    // first connection in the listing.
    this._connections[this._defaultName] = mongoose.connections[0];

    // Create the individual connections.
    forOwn (connections, (opts, name) => this.createConnection (name));
  },

  destroy () {
    return this.closeConnections ();
  },

  /**
   * Create a new connection.
   *
   * @param name
   * @returns {*}
   */
  createConnection (name) {
    if (name === this._defaultName)
      return mongoose.connections[0];

    let conn = mongoose.createConnection ();
    this._connections[name] = conn;

    return conn;
  },

  /**
   * Open the existing connections.
   */
  openConnections () {
    debug ('opening all connections to the database');

    const {connections} = this.config;
    const connecting = mapValues (connections, ({uri, options}, name) => this.openConnection (name, uri, options));

    return BluebirdPromise.props (connecting);
  },

  /**
   * Open a single connection.
   *
   * @param name
   * @param uri
   * @param options
   * @returns {*}
   */
  openConnection (name, uri, options) {
    debug (`opening connection ${name}`);

    let conn = this._connections[name];

    if (!conn)
      throw new Error (`Connection ${name} does not exist.`);

    if (conn.readyState === 1)
      return Promise.resolve (conn);

    this.emit ('connecting', name, conn);

    return conn.openUri (uri, options).then (conn => {
      return this.emit ('open', name, conn).then (() => conn);
    });
  },

  /**
   * Close all open connections.
   */
  closeConnections () {
    const pending = mapValues (this._connections, (conn) => conn.readyState !== 0 ? conn.close () : null);

    return BluebirdPromise.props (pending);
  }
});
