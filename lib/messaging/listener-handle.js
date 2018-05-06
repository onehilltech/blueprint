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
const assert = require ('assert');

/**
 * @class ListenerHandle
 *
 * Handle to a registered listener. The handle allows you to remove a listener
 * from the registry.
 */
module.exports = BO.extend ({
  init () {
    this._super.call (this, ...arguments);

    assert (!!this.listeners, 'The listeners parameter is required');
    assert (this.index !== undefined && this.index !== null, 'The index of the listener is required');
  },

  /**
   * Close the listener.
   */
  close () {
    if (this.listeners === null)
      return;

    this.listeners.removeListenerAt (this.index);
    this.listeners = null;
  }
});
