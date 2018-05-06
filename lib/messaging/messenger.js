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
const EventListeners = require ('./event-listeners');

/**
 * @class Messenger
 *
 * Wrapper class for the events.EventEmitter class to that provides more
 * domain-specific operations.
 */
module.exports = BO.extend ({
  init () {
    this._super.call (this, ...arguments);
    this._eventListeners = {};
  },

  /**
   * Lookup the event listeners container for an event.
   *
   * @param ev      The name of the event
   * @returns {*}
   */
  lookup (ev) {
    let listeners = this._eventListeners[ev];

    if (listeners)
      return listeners;

    return this._eventListeners[ev] = new EventListeners ({name: ev});
  },

  /**
   * Register a listener with the messenger.
   *
   * @param ev
   * @param listener
   */
  on (ev, listener) {
    return this.lookup (ev).on (listener);
  },

  /**
   * Register a listener for a single invocation of an event.
   *
   * @param ev
   * @param listener
   * @returns {Emitter|*|EventEmitter}
   */
  once (ev, listener) {
    return this.lookup (ev).once (listener);
  },

  /**
   * Emit an event to the messenger. The event is sent to all registered
   * listeners in the messenger.
   *
   * @returns {Promise}
   */
  emit () {
    let [name, ...args] = arguments;
    let listeners = this._eventListeners[name];

    return listeners ? listeners.emit (...args) : Promise.resolve ();
  },

  /**
   * Get the listeners for an event.
   *
   * @param ev
   * @returns {*}
   */
  getListeners (ev) {
    return this._eventListeners[ev].listeners;
  },

  /**
   * Test if the event has listeners.
   *
   * @param ev
   * @returns {boolean}
   */
  hasListeners (ev) {
    return (ev in this._eventListeners);
  }
});
