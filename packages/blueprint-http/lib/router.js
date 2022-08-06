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
const { isFunction } = require ('lodash');

/**
 * @class Router
 *
 * Base class for all routers.
 */
module.exports = BO.extend ({
  /// The router specification.
  async specification () {
    throw new Error ('You must override the specification() method');
  },

  /**
   * Build the router.
   *
   * @param app           The Blueprint application.
   * @param options       Router options for mount point.
   */
  async build (app, options = {}) {

    // Get the router specification. We specification property is here for backwards
    // compatibility. We will eventually drop support for the property in favor of
    // the specification function.

    const spec = isFunction (this.specification) ?
      await this.specification (options) :
      this.specification;

    return new RouterBuilder (app, options)
      .addSpecification (spec)
      .build ();
  }
});
