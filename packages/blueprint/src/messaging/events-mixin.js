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

const { Mixin } = require ('base-object');
const Messenger = require ('./messenger');

/**
 * @mixin Events
 *
 * Mixin for adding event support to an object type.
 */
module.exports = Mixin.create ({
  /// The underlying messaging for the object.
  _messenger: null,

  init () {
    this._super.call (this, ...arguments);

    if (!this._messenger)
      this._messenger = new Messenger ();
  },

  /**
   * Register a listener for an event.
   *
   * @returns {*}
   */
  on () {
    return this._messenger.on (...arguments);
  },

  /**
   * Register a listener to handle an event once. After the event is handled, the
   * listener will automatically remove itself.
   *
   * @returns {*}
   */
  once () {
    return this._messenger.once (...arguments);
  },

  /**
   * Emit an event to all listeners.
   *
   * @returns {*}
   */
  emit () {
    return this._messenger.emit (...arguments);
  },

  /**
   * Get the listeners for an event.
   *
   * @param eventName
   * @returns {*}
   */
  getListeners (eventName) {
    return this._messenger.getListeners (eventName);
  },

  /**
   * Test if the object has listeners for the event.
   * @param eventName
   * @returns {*}
   */
  hasListeners (eventName) {
    return this._messenger.hasListeners (eventName);
  }
});
