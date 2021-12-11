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

/// The singleton instance.
const assert = require ("assert");
const debug = require ('debug')('blueprint-mongodb:lib:seed:store');
const { Loader } = require ('@onehilltech/blueprint');

const { merge, isPlainObject, mapValues } = require ('lodash');
const { props } = require ('bluebird');

let singleton = null;

const Planter = require ('./planter');

/**
 * @class Store
 *
 * The Store is responsible managing the known seeds for an application.
 */
module.exports = class Store {
  /// Constructor.
  constructor () {
    this.planters = {};
  }

  /**
   * Get the singleton Planter instance.
   */
  static getInstance () {
    if (singleton !== null)
      return singleton;

    singleton = new Store ();
    return singleton;
  }

  /**
   * This will load the seeds from the specified location.
   *
   * @param location
   */
  async load (location) {
    debug (`loading seed definitions from ${location}`);

    const opts = {
      dirname: location,
      resolve (Seed) {
        assert (!isPlainObject (Seed), 'The seed must extend the Seed class');
        return new Planter (new Seed ());
      }
    };

    // Load the seeds and place them into packets.
    const loader = new Loader ();
    const planters = await loader.load (opts);

    await props (mapValues (planters, (planter => planter.configure ())));

    // Merge the new packets with our current packets.
    merge (this.planters, planters);
  }

  /**
   * Grow a seed inside the planter.
   *
   * @param   name        Name of the seed.
   * @param   conn        The target connection.
   * @param   clear       Clear the database connection.
   */
  async grow (name, conn, clear = true) {
    const planter = this.planters[name];

    if (planter === null)
      throw new Error (`The ${name} planter does not exist`);

    if (clear)
      await planter.clear (conn);

    return planter.grow (conn);
  }
}
