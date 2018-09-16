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

const { BO } = require ('@onehilltech/blueprint');

/**
 * @class Seed
 *
 * Base class for all seeds in mongodb.
 */
module.exports = BO.extend ({
  /**
   * Configure the seed. This is called only one during the lifetime of the seed
   * when it is first loaded into memory.
   */
  configure () {

  },

  /**
   * Reset the seed definition.
   */
  reset () {

  },

  /**
   * Method call before the seed is generated.
   */
  beforeModel () {
    return null;
  },

  /**
   * Get the model for the seed.
   */
  model () {
    return null;
  },

  /**
   * The models for the seed has been generated.
   */
  afterModel (models) {
    return null;
  }
});
