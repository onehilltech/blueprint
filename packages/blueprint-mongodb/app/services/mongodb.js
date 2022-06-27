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

const { Service, computed } = require ('@onehilltech/blueprint');
const { forOwn, mapValues, get } = require ('lodash');

const { props } = require ('bluebird');
const mongoose = require ('mongoose');
const debug = require ('debug')('blueprint-mongodb:mongodb');
const path = require ('path');

const DEFAULT_CONNECTION_NAME = '$default';
const SEEDS_RELATIVE_PATH = 'seeds/mongodb';

mongoose.Promise = Promise;

// Fix deprecation warnings.
mongoose.set ('useFindAndModify', false);
mongoose.set ('useNewUrlParser', true);
mongoose.set ('useCreateIndex', true);

const Connection = require ('../../lib/connection');
const Store = require ('../../lib/seed/store');

/**
 * @class MongoDbService
 */
module.exports = Service.extend ({
  /// Named connections managed by the service.
  _connections: null,

  defaultConnection: computed ({
    get () { return this._connections[this._defaultName]; }
  }),

  defaultConnectionName: computed ({
    get () { return this._defaultName; }
  }),

  connections: computed ({
    get () { return this._connections; }
  }),

  seeds: computed ({
    get () { return this._seeds; }
  }),

  init () {
    this._super.apply (this, arguments);
    this._connections = {};
    this._seeds = {};
    this._seedDefs = null;

    this.config = this.get ('app.configs.mongodb');

    if (this.config)
      this._loadConfiguration (this.config);
  },

  /**
   * Load the configuration into memory.
   *
   * @private
   */
  _loadConfiguration (config) {
    // Locate the module configuration in the application. If there is no
    // configuration, then we need to stop processing. This brings attention
    // to the developer to resolve the problem.

    this._defaultName = get (config, 'defaultConnection', DEFAULT_CONNECTION_NAME);
    const { connections } = config;

    if (!connections || connections.length === 0)
      throw new Error ('You must define at least 1 connection in the configuration.');

    if (!connections[this._defaultName])
      throw new Error ('The default connection configuration is not defined.');

    this._connections[this._defaultName] =
      new Connection (this, this._defaultName,
        connections[this._defaultName],
        mongoose.connections[0]);

    // Create the individual connections.
    forOwn (connections, (config, name) => this.createConnection (name, config));
  },

  /**
   * Configure the service.
   */
  async configure () {
    // Load all the seeds into the store.
    const seedsPath = path.resolve (this.app.appPath, SEEDS_RELATIVE_PATH);
    return Store.getInstance ().load (seedsPath);
  },

  async start () {
    debug ('starting service');
    return this.openConnections ();
  },

  async destroy () {
    debug ('destroying service');
    return this.closeConnections (true);
  },

  /**
   * Create a new connection.
   *
   * @param name
   * @param config
   *
   * @returns {*}
   */
  createConnection (name, config) {
    if (this._connections[name])
      return this._connections[name];

    const conn = new Connection (this, name, config);
    this._connections[name] = conn;

    return conn;
  },

  /**
   * Open all connections known to the service.
   */
  openConnections (reopen = false) {
    debug ('opening all connections to the database');

    return props (mapValues (this._connections, (conn) => conn.open ({}, reopen)));
  },

  /**
   * Open a single connection.
   *
   * @param name                Name of connection
   * @param config              Open options
   * @param forceCloseIfOpen    Force close a connection if already open
   * @returns {*}
   */
  async openConnection (name, config, reopen = false) {
    const conn = this._connections[name]

    if (!conn)
      throw new Error (`${name} connection does not exist`);

    return conn.open (config, reopen);
  },

  /**
   * Lookup a connection by its name. If the connection does not exist, then an
   * an exception is thrown.
   *
   * @param name
   * @returns {*}
   */
  connection (name) {
    const conn = this._connections[name];

    if (conn)
      return conn;

    throw new Error (`connection ${name} does not exist`);
  },

  /**
   * Close all open connections.
   */
  async closeConnections (force) {
    return props (mapValues (this._connections, conn => conn.close (force)));
  },

  /**
   * Seed all the database connections.
   *
   * @param clear         Clear the database before seeding
   * @returns {*}
   */
  async resetConnections () {
    return props (mapValues (this.connections, conn => conn.reset ()))
  }
});
