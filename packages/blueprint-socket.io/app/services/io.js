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

const blueprint = require ('@onehilltech/blueprint');
const { Service } = blueprint;
const { mapValues } = require ('lodash');

const SocketIO = require ('socket.io');
const debug = require ('debug')('blueprint-socketio:service:io');

const DEFAULT_NAMESPACE = '/';

/**
 * The service that manages connections for SocketIO.
 */
module.exports = Service.extend ({
  _connections: {},

  configure () {

  },

  start () {
    const connections = blueprint.app.server.connections;

    this._connections = mapValues (connections, ({server}, name)=> {
      debug (`opening Socket.IO connection on ${name}`);

      // Make a new Socket IO instance.
      let io = SocketIO (server);

      // Listen for connections on this instance.
      io.on ('connection', socket => this._connection (name, socket));

      return io;
    });
  },

  /**
   * Emit an event on a named io socket.
   *
   * insecure: io ('insecure')
   *
   * @param name
   * @param ev
   * @param args
   */
  emit (name, ev, ...args) {
    const io = this._connections[name];

    if (!io)
      throw new Error (`The named socket ${name} does not exist.`);

    // Emit the event on the socket.
    io.emit (ev, ...args);
  },

  /**
   * Handle the connection events for sockets.
   *
   * @param name              Name of the connection
   * @param socket            The connected socket
   * @private
   */
  _connection (name, socket) {
    // Notify all application level listeners that we have a connect event.
    this.app.emit ('socket.io.connection', name, socket);
  }
});
