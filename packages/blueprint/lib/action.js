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

const { BO, computed } = require ('base-object');

/**
 * @class Action
 *
 * The base class for all actions.
 *
 * _About the events_:
 *
 * The event API for the actions is different from the traditional Events API where
 * the events correspond to objects on this class. Because you cannot gain access to
 * an Action instance (i.e., it is kept internally), the Events correspond to the
 * application. This is equivalent to saying the Action supports the ApplicationMessaging
 * events. We do not use the ApplicationMessaging mixin, however, because we can gain
 * access to the application object via the `controller` property.
 */
module.exports = BO.extend ({
  mergedProperties: ['schema'],

  /**
   * Optional express-validator schema for validating the request that
   * trigger the action.
   */
  schema: null,

  /**
   * Optional middleware function(s) for validating the request that triggered
   * the action.
   */
  validate: null,

  /**
   * Execute the request.
   *
   * The signature of this method is f(req, res);
   *
   * This method has the option of returning a Promise, which informs the framework
   * that completion of the request is pending.
   *
   * @returns {Promise|null}
   */
  execute: null,

  /// The hosting controller for the action.
  controller: null,

  /// Quick access to the application.
  app: computed.alias ('controller.app'),

  /// @{ Events

  init () {
    this._super.call (this, ...arguments);

    if (this.controller)
      this.controller.registerAction (this);
  },

  /**
   * Configure the action.
   */
  async configure () {

  },

  emit () {
    return this.app.emit (...arguments);
  },

  on () {
    return this.app.on (...arguments);
  },

  once () {
    return this.app.once (...arguments);
  },

  hasListeners (ev) {
    return this.app.hasListeners (ev);
  },

  getListeners (ev) {
    return this.app.getListeners (ev);
  }

  /// @}
});
