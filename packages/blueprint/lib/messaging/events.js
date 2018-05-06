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

  on () {
    return this._messenger.on (...arguments);
  },

  once () {
    return this._messenger.once (...arguments);
  },

  emit () {
    return this._messenger.emit (...arguments);
  },

  getListeners (ev) {
    return this._messenger.getListeners (ev);
  },

  hasListeners (ev) {
    return this._messenger.hasListeners (ev);
  }
});
