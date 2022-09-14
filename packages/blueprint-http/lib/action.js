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
module.exports = class Action {
  /**
   * Constructor
   * *
   * @param controller        The parent controller
   */
  constructor (controller) {
    Object.defineProperty (this, 'controller', { writable: false, configurable: false, value: controller});
  }

  /**
   * Configure the action.
   */
  async configure () {

  }

  /**
   * Get the schema for the action.
   */
  get schema () {

  }

  /// The action has a dynamic validate method. When set to true, the validate()
  /// method will be called to validate the request.
  hasDynamicValidateMethod = false;

  /**
   * Optional middleware function for validating the request that triggered
   * the action.
   */
  async validate (req) {

  }

  /// The action has a dynamic sanitize method. When set to true, the sanitize()
  //   /// method will be called to validate the request.
  hasDynamicSanitizeMethod = false;

  /**
   * Optional middleware function for sanitizing the request.
   * *
   * @param req
   */
  async sanitize (req) {

  }

  /**
   * Execute the request.
   *
   * The signature of this method is f(req, res);
   *
   * This method has the option of returning a Promise, which informs the framework
   * that completion of the request is pending.
   */
  async execute (req, res) {
    throw new Error ('You must implement the execute(req, res) method.');
  }

  get app () {
    return this.controller.app;
  }

  /// @{ Events

  emit () {
    return this.app.emit (...arguments);
  }

  on () {
    return this.app.on (...arguments);
  }

  once () {
    return this.app.once (...arguments);
  }

  hasListeners (ev) {
    return this.app.hasListeners (ev);
  }

  getListeners (ev) {
    return this.app.getListeners (ev);
  }

  /// @}
};
