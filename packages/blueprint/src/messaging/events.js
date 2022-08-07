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

const decorator = require ('@onehilltech/decorator');
const Messenger = require ('./messenger');

/**
 * Apply the event decorator to the target class.
 *
 * @param target        The target class
 */
function applyToTarget (target) {
  Object.defineProperty (target.prototype, '_messenger', {
    get () { return this.__messenger || (this.__messenger = new Messenger ())}
  });

  /**
   * Register a listener for an event.
   */
  target.prototype.on = function () {
    return this._messenger.on (...arguments);
  }

  /**
   * Register a listener to handle an event once. After the event is handled, the
   * listener will automatically remove itself.
   *
   * @returns {*}
   */
  target.prototype.once = function () {
    return this._messenger.once (...arguments);
  }

  /**
   * Emit an event to all listeners.
   *
   * @returns {*}
   */
  target.prototype.emit = function () {
    return this._messenger.emit (...arguments);
  }

  /**
   * Get the listeners for an event.
   *
   * @param eventName
   */
  target.prototype.getListeners = function (eventName) {
    return this._messenger.getListeners (eventName);
  }

  /**
   * Test if the object has listeners for the event.
   * @param eventName
   * @returns {*}
   */
  target.prototype.hasListeners = function (eventName) {
    return this._messenger.hasListeners (eventName);
  }

  return target;
}


/**
 * @mixin Events
 *
 * Mixin for adding event support to an object type.
 */
module.exports = exports = decorator (function evented (target) {
  applyToTarget (target);
});

/// Allow client to apply events decorator to their classes without having to
/// use the decorator syntax.

exports.decorate = applyToTarget;
