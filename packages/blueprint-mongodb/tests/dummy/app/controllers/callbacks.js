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

const {
  model
} = require ('@onehilltech/blueprint');

const ResourceController = require ('../../../../lib/resource-controller');

module.exports = ResourceController.extend ({
  model: model ('author'),

  createCallbacks: [],

  create () {
    return this._super.call (this, ...arguments).extend ({
      prepareDocument (req, doc) {
        this.controller.createCallbacks = ['prepareDocument'];
        return this._super.call (this, ...arguments);
      },

      preCreateModel () {
        this.controller.createCallbacks.push ('preCreateModel');
        return this._super.call (this, ...arguments);
      },

      createModel () {
        this.controller.createCallbacks.push ('createModel');
        return this._super.call (this, ...arguments);
      },

      postCreateModel () {
        this.controller.createCallbacks.push ('postCreateModel');
        return this._super.call (this, ...arguments);
      },

      prepareResponse () {
        this.controller.createCallbacks.push ('prepareResponse');
        return this._super.call (this, ...arguments);
      }
    })
  }
});
