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

const { Service, computed, Loader, model } = require ('@onehilltech/blueprint');
const { forOwn, mapValues, get, isPlainObject, map, pickBy } = require ('lodash');

const { props } = require ('bluebird');

const assert = require ('assert');
const mongoose = require ('mongoose');
const debug = require ('debug')('blueprint-mongodb:mongodb');
const path = require ('path');
const fs = require ('fs-extra');

const DEFAULT_CONNECTION_NAME = '$default';
const SEEDS_RELATIVE_PATH = 'seeds/mongodb';

const MONGODB_SCHEMA_ID = '619b0a46c8d6ae7eefd9665e';

mongoose.Promise = Promise;

// Make Mongoose use `findOneAndUpdate()`. Note that this option is `true`
// by default, you need to set it to false.
mongoose.set ('useFindAndModify', false);

const { build, seed, clear } = require ('@onehilltech/dab');
const backend = require ('@onehilltech/dab-mongodb');

/**
 * @class MongoDbService
 */
module.exports = Service.extend ({
  _loader: new Loader (),

  /// Named connections managed by the service.
  _connections: null,

  /// The application start barrier.
  _appStart: null,

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

    // setup the messaging.
    this._loadConfiguration ();
  },

  __mongodb: model (),

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

  start () {
    debug ('starting service');

    return this.openConnections ();
  },

  destroy () {
    debug ('destroying service');

    return this.closeConnections (true);
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

    const { connections } = this.config;
    const connecting = mapValues (connections, (config, name) => this.openConnection (name, config));

    return props (connecting);
  },

  /**
   * Open a single connection.
   *
   * @param name      Name of connection
   * @param opts      Open options
   * @returns {*}
   */
  openConnection (name, opts) {
    let { version, uri, seed: seedData, options, clear = true} = opts;
    debug (`opening connection ${name}`);

    let conn = this._connections[name];

    if (!conn)
      throw new Error (`Connection ${name} does not exist.`);

    if (conn.readyState === 1)
      return Promise.resolve (conn);

    this.emit ('connecting', name, conn);

    return conn.openUri (uri, options).then (conn => {
      return this.emit ('open', name, conn)
        .then (() => version ? this._checkSchemaVersionAndMigrate (name, conn, version) : null)
        .then (() => seedData ? this.seedConnection (name, conn, clear) : null)
        .then (() => conn);
    });
  },

  /**
   * Seed a connection.
   *
   * @private
   */
  seedConnection (name, conn, clear) {
    if (!!clear && clear === true)
      clear = [];

    // When seeding a connection, we always build a new data model. This
    // is because we need to generate new ids for all model elements.

    debug (`seeding database connection ${name}`);

    return this._buildSeed (name, conn)
      .then (data => !!data ? (!!clear ? this._clearConnection (name, conn, clear) : Promise.resolve ())
        .then (() => pickBy (data, (models, name) => backend.supports (conn, name)))
        .then (data => seed (conn, data, { backend })) : null)
      .then (models => {
        this._seeds[name] = models;

        if (!!models)
          this.emit ('seeded', name, conn, models);

        return models;
      });
  },

  /**
   * Clear the data on a connection.
   *
   * @param name
   * @param conn
   * @param models
   * @return {Promise<void>}
   * @private
   */
  _clearConnection (name, conn, models = []) {
    debug (`clearing data on connection ${name}`);

    return clear (conn, models, { backend });
  },

  /**
   * Build the seeds for a connection.
   *
   * @param name
   * @param conn
   * @returns {*}
   * @private
   */
  _buildSeed (name, conn) {
    return this._loadSeedDefinitions ().then (seeds => {
      debug (`building seed definition for connection ${name}`);
      let seed = seeds[name];

      if (!seed)
        return null;

      return Promise.resolve (seed.reset ())
        .then (() => seed.beforeModel ())
        .then (() => seed.model ())
        .then (models => build (pickBy (models, (models, name) => backend.supports (conn, name)), { backend }))
        .then (result => Promise.resolve (seed.afterModel (result)).then (() => result));
    });
  },

  /**
   * Load all the seed definitions into memory.
   *
   * @returns {*}
   * @private
   */
  _loadSeedDefinitions () {
    if (this._seedDefs)
      return Promise.resolve (this._seedDefs);

    debug ('loading seed definitions');

    const dirname = path.resolve (this.app.appPath, SEEDS_RELATIVE_PATH);
    const opts = {
      dirname,
      resolve (Seed) {
        assert (!isPlainObject (Seed), 'The seed must extend the Seed class');
        return new Seed ();
      }
    };

    return this._loader.load (opts)
      .then (result => {
        // Store the seed definitions.
        this._seedDefs = result;

        // Allow each seed to perform a one-time configuration.
        return props (map (result, seed => seed.configure ())).then (() => result);
      });
  },

  /**
   * Close all open connections.
   */
  closeConnections (force) {
    return props (mapValues (this._connections, (conn) => {
      if (conn.readyState !== 0)
        return conn.close (force);
    }));
  },

  /**
   * Check the schema version of the database. The version diff, then we need to
   * perform migration of the database.
   *
   * @private
   */
  _checkSchemaVersionAndMigrate (name, connection, version = 1) {
    let app = this.app;

    /**
     * Run the migration script.
     *
     * @param fileName
     * @returns {Promise<unknown>}
     */
    function runMigration (fileName) {
      let Migration = require (fileName);
      let migration = new Migration ({ app });

      return Promise.resolve (migration.prepare (connection))
        .then (migration.migrate (connection))
        .then (migration.finalize (connection));
    }

    /**
     * Upgrade the database by running a series of migration scripts.
     */
    function upgrade (appPath, from, to) {
      if (from === to)
        return Promise.resolve ();

      let next = from + 1;
      let migrationFile = path.resolve (appPath, `migrations/mongodb/up/${next}.js`);

      return fs.pathExistsSync (migrationFile) ?
        runMigration (migrationFile).then (() => upgrade (appPath, next, to)) :
        upgrade (appPath, next, to);
    }

    /**
     * Downgrade the database by running a series of migration scripts.
     */
    function downgrade (appPath, from, to) {
      if (from === to)
        return;

      let next = from - 1;
      let migrationFile = path.resolve (appPath, `migrations/mongodb/down/${next}.js`);

      return fs.pathExistsSync (migrationFile) ?
        runMigration (migrationFile).then (() => downgrade (appPath, next, to)) :
        downgrade (appPath, next, to);
    }

    return this.__mongodb.findById (MONGODB_SCHEMA_ID)
      .then (schema => {
        if (!!schema) {
          function migrate (appPath) {
            if (version > schema.version)
              return upgrade (appPath, schema.version, version);
            else if (version < schema.version)
              return downgrade (appPath, schema.version, version);
          }

          // The version of the database has changed. Let's give the application the
          // option to migrate the data to the new version of the database.

          if (version !== schema.version)
            return migrate (this.app.appPath).then (() => Object.assign (schema, { version }).save ());
        }
        else {
          // This is the first time we are seeing the schema id. Let's create insert
          // a new document into the database for future reference.
          return upgrade (this.app.appPath, 1, version).then (this.__mongodb.create ({ _id: MONGODB_SCHEMA_ID, version }));
        }
      });
  }
});
