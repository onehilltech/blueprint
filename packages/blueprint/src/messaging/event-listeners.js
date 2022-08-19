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

const assert = require ('assert');
const { concat } = require ('lodash');

const ListenerHandle = require ('./listener-handle');
const Listener = require ('./listener');
const SimpleListener = require ('./simple-listener');
const { isFunction } = require ('lodash');

/**
 * Wrapper class for a set of listeners for an event.
 */
module.exports = class EventListeners {
  /**
   * Constructor
   *
   * @param name        The name of the event listeners.
   */
  constructor (name) {
    assert (!!name, 'You must define the name property.');

    this.name = name;
    this._on = [];
    this._once = [];
  }

  /**
   * Get the collection of listeners, which includes once only listeners.
   *
   * @returns {*}
   */
  get listeners () {
    return concat (this._once, this._on);
  }

  /**
   * Register a new listener for the event.
   *
   * @param listener
   */
  on (listener) {
    assert ((listener instanceof Listener) || isFunction (listener), 'The listener must be a instance of Listener or a function.');

    if (isFunction (listener))
      listener = new SimpleListener (null, listener);

    const index = this._on.push (listener) - 1;
    return new ListenerHandle (this, index);
  }

  /**
   * Register a listener that is only called once. Once the listener is executed,
   * it will be removed from the registry.
   *
   * @param listener
   */
  once (listener) {
    assert ((listener instanceof Listener) || isFunction (listener), 'The listener must be a instance of Listener or a function.');

    if (isFunction (listener))
      listener = new SimpleListener (listener);

    this._once.push (listener);
  }

  /**
   * Emit a new event. The order the event is emitted to the registered listeners
   * is non-deterministic.
   */
  async emit () {
    // Make a copy of the once array, and erase it contents. Then, add the current
    // listeners from _on. This will prevent listeners added while processing an
    // event from firing until the next event is emitted.
    const once = this._once.splice (0);
    const listeners = concat (once, this._on);

    // The listeners have the option of returning a Promise if they want to allow
    // the client to wait until the event handling is complete. We therefore need
    // to account for this possibility. This does not mean the client that emits
    // the event will be synchronous. The client just has the option of waiting
    // until the event has been emitted to all listeners.

    for await (const listener of listeners) {
      listener.handleEvent (...arguments);
    }
  }

  /**
   * Remove the listener at the specified index.
   *
   * @param index
   */
  removeListenerAt (index) {
    this._on.splice (index, 1);
  }
};

