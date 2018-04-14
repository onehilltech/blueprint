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

const Object = require ('../object');
const Messenger = require ('./messenger');

const DEFAULT_MESSENGER_KEY = '_';

/**
 * @class MessagingFramework
 *
 * The root object in the messaging framework.
 */
module.exports = Object.extend ({
  init () {
    this._super.call (this, ...arguments);
    this.reset ();
  },

  /**
   * Reset the state of the messaging framework.
   */
  reset () {
    this.messengers = {
      [DEFAULT_MESSENGER_KEY]: new Messenger ({key: DEFAULT_MESSENGER_KEY})
    };
  },

  /**
   * Lookup a messenger. If the messenger does not exist, then it will create
   * a new one for the key.
   *
   * @param key
   * @returns {Messenger}
   */
  lookup (key = DEFAULT_MESSENGER_KEY) {
    let messenger = this.messengers[key];

    if (messenger)
      return messenger;

    return this.messengers[key] = new Messenger ({key});
  },

  /**
   * Register a listener with the default messenger.
   *
   * @param ev
   * @param listener
   */
  on (ev, listener) {
    return this.messengers[DEFAULT_MESSENGER_KEY].on (ev, listener);
  },

  /**
   * Register a one-time listener with the default messenger.
   *
   * @param ev
   * @param listener
   */
  once (ev, listener) {
    return this.messengers[DEFAULT_MESSENGER_KEY].once (ev, listener);
  },

  /**
   * Emit an event to the default messenger.
   */
  emit () {
    return this.messengers[DEFAULT_MESSENGER_KEY].emit (...arguments);
  }
});
