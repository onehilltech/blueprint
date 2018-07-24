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
const assert = require ('assert');

/**
 * @class AsyncListener
 *
 * Listener that handles events asynchronously. This means the client code that
 * emitted the original event will not wait until this event listener is complete
 * to continue moving forward.
 */
module.exports = Listener.extend ({
  /// The asynchronous method called by the listener. The subclass must
  /// implement this method.
  asyncHandleEvent: null,

  init () {
    this._super.call (this, ...arguments);

    assert (!!this.asyncHandleEvent, 'The asynchronous listener must implement the asyncHandleEvent() method.');
  },

  handleEvent () {
    let args = arguments;

    process.nextTick (() => {
      this.asyncHandleEvent (...args);
    });
  },
});
