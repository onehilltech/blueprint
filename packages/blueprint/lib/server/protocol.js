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
const { fromCallback } = require ('bluebird');

/**
 * @class Protocol
 *
 * Base class for all protocols that can integrate with the server.
 */
module.exports = BO.extend ({
  /// The server object associated with the protocol.
  server: null,

  /// User-defined options for the protocol.
  options: null,

  /**
   * Start listening for incoming connections.
   *
   * @returns {Promise<any>}
   */
  listen () {
    return fromCallback (callback => {
      this.server.listen (this.options, callback);
    });
  },

  /**
   * Close the server connection.
   *
   * @returns {Promise<any>}
   */
  close () {
    return fromCallback (callback => {
      this.server.close (callback);
    });
  }
});
