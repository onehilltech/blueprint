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

const { BO } = require ('base-object');
const RouterBuilder = require ('./router-builder');
const assert = require ('assert');

/**
 * @class Router
 *
 * Base class for all routers.
 */
module.exports = BO.extend ({
  /// The router specification.
  specification: null,

  init () {
    this._super.call (this, ...arguments);

    assert (!!this.specification, 'You must define the "specification" property.');
  },

  /**
   * Build the router.
   *
   * @param app
   */
  async build (app) {
    const builder = new RouterBuilder (app);
    return builder.addSpecification (this.specification).build ();
  }
});
