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

const Listener = require ('./listener');

/**
 * @class SimpleListener
 *
 * Adapter for porting listener functions to Listener objects. The SimpleListener
 * object is provided for backwards compatibility support.
 *
 * The constructor takes a single function, which is mapped to the handleEvent() method
 * on the Listener class.
 *
 * This object is used internally by the Blueprint framework.
 */
module.exports = class SimpleListener extends Listener {
  constructor (listener) {
    super ();

    this.listener = listener;
  }

  /**
   * Handle the event.
   */
  handleEvent () {
    return this.listener.call (this.listener, ...arguments);
  }
};
