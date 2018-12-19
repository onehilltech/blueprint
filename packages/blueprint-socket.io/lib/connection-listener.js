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

const { Listener } = require ('@onehilltech/blueprint');
const debug = require ('debug') ('blueprint-socket.io:listeners:connection-listener');

/**
 * The base class for all Socket.IO connection listeners.
 *
 * This listener is notified whenever a client connects and disconnects to and
 * from the server. The listener can optionally restrict itself to clients on
 * a specific connection using the `connections` property.
 */
module.exports = Listener.extend ({
  /// List of connection names the listener is bound. If the list is empty,
  /// then the listener is bound on all connections.
  connections: [],

  concatProperties: ['connections'],

  handleEvent (name, socket) {
    if (this.connections.length > 0) {
      debug (`checking if listener is bound to ${name}`);

      if (!this._matchesConnection (name))
        return;
    }

    // Listen for the disconnect event, and then pass control to the
    // subclass to do what it needs to do.
    debug ('registering listener for disconnect socket event');
    socket.on ('disconnect', () => this.disconnect (name, socket));

    debug ('notifying subclass of the connection event');
    this.connection (name, socket);
  },

  /**
   * Notification of a new socket connection.
   *
   * @param name
   * @param socket
   */
  connection (name, socket) {

  },

  /**
   * Notification that a socket has disconnected.
   *
   * @param name
   * @param socket
   */
  disconnect (name, socket) {

  },

  /**
   * Check if the connection name matches any of the connection this listener
   * is bound.
   *
   * @param name          Name of the connection
   * @return {boolean}    True if matches; otherwise false.
   * @private
   */
  _matchesConnection (name) {
    if (this.connections.length === 0)
      return true;

    for (let i = 0; i < this.connections.length; ++ i)
      if (name.match (this.connections[i]) !== null)
        return true;

    return false;
  }
});