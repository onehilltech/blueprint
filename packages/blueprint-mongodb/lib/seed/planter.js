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

const { pickBy } = require ('lodash');
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
  async grow (conn) {
    // Reset the seed.
    await this.seed.reset ();

    // Inform the seed we are about to request its model.
    await this.seed.beforeModel ();

    // Get the model from the seed.
    const model = await this.seed.model ();

    // Prune the models that we do not support on this connection.
    const rawModels = await build (pickBy (model, (definition, name) => backend.supports (conn, name)), { backend });

    await this.seed.afterModel (rawModels);

    // Seed the connection with the models.
    this.models = await seed (conn, rawModels, { backend });

    return this.models;
  }
};
