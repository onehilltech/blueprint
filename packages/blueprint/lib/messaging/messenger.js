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

const EventListeners = require ('./event-listeners');

/**
 * @class Messenger
 *
 * Wrapper class for the events.EventEmitter class that provides more
 * domain-specific operations.
 */
module.exports = class Messenger {
  constructor (eventListeners = {}) {
    this._eventListeners = eventListeners;
  }

  /**
   * Lookup the event listeners container for an event.
   *
   * @param name      The name of the event.
   * @returns         EventListeners for name.
   */
  lookup (name) {
    return this._eventListeners[name] || (this._eventListeners[name] = new EventListeners (name));
  }

  /**
   * Register a listener with the messenger.
   *
   * @param name
   * @param listener
   */
  on (name, listener) {
    return this.lookup (name).on (listener);
  }

  /**
   * Register a listener for a single invocation of an event.
   *
   * @param name
   * @param listener
   */
  once (name, listener) {
    return this.lookup (name).once (listener);
  }

  /**
   * Emit an event to the messenger. The event is sent to all registered
   * listeners in the messenger.
   *
   * @returns {Promise}
   */
  async emit () {
    let [name, ...args] = arguments;
    return this.lookup (name).emit (...args);
  }

  /**
   * Get the listeners for an event.
   *
   * @param name
   */
  getListeners (name) {
    return this._eventListeners[name].listeners;
  }

  /**
   * Test if the event has any registered listeners.
   *
   * @param name
   * @returns {boolean}
   */
  hasListeners (name) {
    return (name in this._eventListeners);
  }
};
