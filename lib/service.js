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
const { Events } = require ('./messaging');

/**
 * @class Service
 *
 * The service represents an abstraction that runs in the background while the
 * application is live.
 */
module.exports = BO.extend (Events, {
  /// The hosting application for the service.
  app: null,

  /**
   * Instruct the service to configure itself. We have the configure() method
   * because the init() method is synchronous. It is therefore hard for the service
   * to call methods that are asynchronous during configuration. The configure
   * method allows this because you can return a Promise, if needed.
   *
   * @return {Promise|null}
   */
  configure () {
    return null;
  },

  /**
   * Destroy the service.
   */
  destroy () {
    return null;
  },

  /**
   * Instruct the service to start.
   *
   * @return {Promise|null}
   */
  start () {
    return null;
  }
});