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

const { pickBy, forOwn } = require ('lodash');
const { seed, build, clear } = require ('@onehilltech/dab');
const backend = require ('@onehilltech/dab-mongodb');

module.exports = class Planter {
  constructor (seed) {
    this.seed = seed;
  }

  async configure () {
    return this.seed.configure ();
  }

  /**
   * Cleanup the connection.
   */
  async clear (conn, models = []) {
    this.models = null;

    if (!!models && models === true)
      models = [];

    return clear (conn, models, { backend })
  }

  /**
   * Grow the seed that is in the planter.
   */
  async grow (conn, options = {}) {
    const { grow = true, models } = options;

    // Reset the seed.
    await this.seed.reset ();

    // Inform the seed we are about to request its model, then get the model.
    await this.seed.beforeModel ();
    const results = grow ? await this.seed.model () : {};

    // Merge the additional models into the seed.
    forOwn (models, (value, key) => results[key] = (results[key] || []).concat (value));

    // Prune the models that we do not support on this connection. Then, let
    // the seed do any post processing of the supported models.
    const supported = await build (pickBy (results, (definition, name) => backend.supports (conn, name)), { backend });
    await this.seed.afterModel (supported);

    // Seed the connection with the models.
    try {
      this.models = await seed (conn, supported, { backend, resolved: true });
    }
    catch (err) {
      console.error (err);
    }

    return this.models;
  }
};
