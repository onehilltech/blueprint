/*
 * Copyright (c) 2021 One Hill Technologies, LLC
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

const path = require ("path");
const mongoose = require ('mongoose');
const { merge } = require ('lodash');

const { clear } = require ('@onehilltech/dab');
const { env } = require ('@onehilltech/blueprint');
const backend = require ("@onehilltech/dab-mongodb");
const debug = require ('debug')('blueprint-mongodb:mongodb');
const fs = require ('fs-extra');

const Store = require ('./seed/store');

const MONGODB_SCHEMA_ID = '619b0a46c8d6ae7eefd9665e';

/**
 * @class Connection
 *
 * Wrapper class for the Mongoose connection.
 */
module.exports = class Connection {
  constructor (service, name, config, conn) {
    this.service = service;
    this.name = name;
    this.config = config;

    // Create a new connection within the mongoose framework.
    this.conn = !!conn ? conn : mongoose.createConnection ();
  }

  /**
   * Open the connection to the database.
   *
   * @param config          Configuration overrides.
   * @param reopen          Reopen the connection if already open
   */
  async open (config = {}) {
    if (this.isOpen)
      return;

    debug (`[${this.name}]: opening database connection`);

    const merged = merge ({}, this.config, config);
    const { version, uri, seed, options } = merged;

    debug (`opening connection ${this.name}`);
    this.conn = await this.conn.openUri (uri, options);

    if (seed) {
      if (env === 'production')
        throw new Error ('You cannot seed the production environment.');

      await this.seed ();
    }

    if (version)
      await this.migrate (version);

    return this;
  }

  /// Check if the database connection is open.
  get isOpen () {
    return this.conn.readyState === 1;
  }

  /**
   * Close the database connection.
   */
  async close (force) {
    debug (`[${this.name}]: closing database connection`);

    if (this.conn.readyState !== 0)
      return this.conn.close (force);
  }

  /**
   * Reset the database connection. This will reseed the database and
   * apply migrations.
   */
  async reset (config = {}) {
    const merged = merge ({}, this.config, config);
    const { version, seed } = merged;

    if (seed)
      await this.seed ();

    if (version)
      await this.migrate (version);

    return this;
  }

  /**
   * Clear the data for the connection.
   *
   * @returns {Promise<*>}
   */
  async clear (models = []) {
    debug (`[${this.name}]: clearning database connection`);

    return clear (this.conn, models, { backend })
  }

  /**
   * Seed the database connection with the specified data.
   *
   * @param clear
   */
  async seed (clear = []) {
    debug (`[${this.name}]: seeding database connection`);

    if (!!clear && clear === true)
      clear = [];

    // Find the planter for the connection. We are going to use it to
    // seed this database connection.

    const planter = Store.getInstance ().planters[this.name];

    if (!planter)
      return;

    // Clear the database connection.
    await planter.clear (this.conn, clear);

    // Grow the seed inside the planter.
    return planter.grow (this.conn);
  }

  /**
   * Check the schema version of the database. The version diff, then we need to
   * perform migration of the database.
   *
   * @private
   */
  async migrate (version = 1) {
    debug ('checking schema version and migrating if necessary');

    /**
     * Run the migration script.
     *
     * @param fileName
     * @returns {Promise<unknown>}
     */
    const runMigration = async (fileName) => {
      const Migration = require (fileName);
      const migration = new Migration ({ app: this.app });

      await migration.prepare (this.conn);
      await migration.migrate (this.conn);
      await migration.finalize (this.conn);
    }

    /**
     * Upgrade the database by running a series of migration scripts.
     */
    const upgrade = async (from, to) => {
      if (from === to)
        return;

      let next = from + 1;
      let migrationFile = path.resolve (this.service.app.appPath, `migrations/mongodb/up/${next}.js`);

      const exists = await fs.pathExists (migrationFile);

      if (exists)
        await runMigration (migrationFile);

      return upgrade (next, to);
    }

    /**
     * Downgrade the database by running a series of migration scripts.
     */
    const downgrade = async (from, to) => {
      if (from === to)
        return;

      let next = from - 1;
      let migrationFile = path.resolve (this.service.app.appPath, `migrations/mongodb/down/${next}.js`);

      const exists = await fs.pathExists (migrationFile);

      if (exists)
        await runMigration (migrationFile);

      return downgrade (next, to);
    }

    const schema = await this.conn.models.__mongodb.findById (MONGODB_SCHEMA_ID);

    if (!!schema) {
      const migrate = async () => {
        if (version > schema.version)
          return upgrade (schema.version, version);
        else if (version < schema.version)
          return downgrade (schema.version, version);
      }


      if (version !== schema.version) {
        // The version of the database has changed. Let's give the application the
        // option to migrate the data to the new version of the database.

        await migrate ();

        // Update the schema version.
        schema.version = version;
        return await schema.save ();
      }
    }
    else {
      // This is the first time we are seeing the schema id. Let's create insert
      // a new document into the database for future reference.
      await upgrade (1, version);

      return await this.conn.models.__mongodb.create ({ _id: MONGODB_SCHEMA_ID, version });
    }
  }

  /**
   * Create a model on this connection.
   *
   * @param arguments
   * @returns {*}
   */
  model () {
    return this.conn.model (...arguments);
  }

  once () {
    return this.conn.once (...arguments);
  }
}
