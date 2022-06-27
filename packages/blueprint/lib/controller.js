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
const { Events } = require ('./messaging');

/**
 * @class Controller
 *
 * Base class for all controllers.
 */
module.exports = BO.extend (Events, {
  /// The hosting application for the controller.
  app: null,

  _registered: null,

  _configured: false,

  init () {
    this._super.call (this, ...arguments);
    this._registered = [];
  },

  registerAction (action) {
    this._registered.push (action);

    if (this._configured)
      action.configure ();
  },

  /**
   * Configure the controller.
   *
   * @returns {Promise<void>}
   */
  async configure () {
    for await (const action of (this._registered || []))
      await action.configure ();
  }
});
