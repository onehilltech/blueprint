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

const { BaseObject } = require ('base-object');
const { Events } = require ('./messaging');

/**
 * @class Service
 *
 * The service represents an abstraction that runs in the background while the
 * application is live.
 */
module.exports = BaseObject.extend (Events, {
  /**
   * Configure the service.
   *
   * @param   app       The parent application
   */
  async configure (app) {
    this.app = app;
  },

  /**
   * Start the service.
   */
  async start () {

  },

  /**
   * Destroy the service.
   */
  async destroy () {
    return null;
  }
});
