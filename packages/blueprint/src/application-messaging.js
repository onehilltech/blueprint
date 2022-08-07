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

const Mixin = require ('./mixin');
const framework = require ('./-framework');

const {
  Events
} = require ('./messaging');

/**
 * @mixin ApplicationMessaging
 *
 * Mixin for adding Event support to a class where the target messenger
 * is the Blueprint application.
 */
module.exports = Mixin.create (Events, {
  init () {
    this._super.call (this, {messenger: framework})
  }
});
