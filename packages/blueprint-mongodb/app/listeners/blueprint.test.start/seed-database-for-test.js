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

const blueprint = require ('@onehilltech/blueprint');
const { Listener, service } = blueprint;
const { mapValues } = require ('lodash');

const debug = require ('debug') ('blueprint-mongodb:listeners:blueprint.test.start:seed');

module.exports = Listener.extend ({
  mongodb: service (),

  init () {
    this._super.call (this, ...arguments);
    this._data = {};
  },

  async handleEvent () {
    debug ('resetting all database connections');

    // Reset all the connections and seed them at the same time. After seeding the
    // connections, we are going to cache the models for each connection. This will
    // improve the execution time of each unit test, especially for those that have
    // complex application seeds.

    const { connections } = this.mongodb;

    for await (const connection of Object.values (connections)) {
      const rawModels = this._data[connection.name];

      if (!!rawModels) {
        await connection.reset ({ seed: false, version: false, models: rawModels });
      }
      else {
        const results = await connection.reset ({ seed: true });
        this._data[connection.name] = results.data;
      }
    }
  },

  _data: null,
});
