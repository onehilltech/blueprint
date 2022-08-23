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

const { fromCallback } = require ('bluebird');

/**
 * @class Protocol
 *
 * Base class for all protocols that can integrate with the server.
 */
class Protocol {
  /**
   * Constructor
   *
   * @param server          The server
   * @param options         Protocol options
   */
  constructor (server, options) {
    Object.defineProperty (this, 'server', { writable: false, value: server });
    Object.defineProperty (this, 'options', { writable: false, value: options });
  }

  /**
   * Start listening for connections.
   * *
   * @return {*}
   */
  listen () {
    return fromCallback (callback => {
      this.server.listen (this.options, callback);
    });
  }

  /**
   * Close the protocol.
   *
   * @return {*}
   */
  close () {
    return fromCallback (callback => {
      this.server.close (callback);
    });
  }
}
