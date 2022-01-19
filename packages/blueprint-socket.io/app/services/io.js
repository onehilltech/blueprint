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

const { Server: SocketIO } = require("socket.io");
const debug = require ('debug')('blueprint-socket.io:service:io');

/**
 * The service that manages connections for SocketIO.
 */
module.exports = Service.extend ({
  _connections: {},

  configure () {
    console.log ('configuring the io service');
  },

  start () {
    console.log ('starting the io service');
    const connections = blueprint.app.server.connections;

    this._connections = mapValues (connections, ({server}, name)=> {
      debug (`opening Socket.IO connection on ${name}`);

      // Make a new Socket IO instance.
      const io = new SocketIO (server);

      // Listen for connections on this instance.
      io.on ('connection', socket => this._connection (name, socket));

      return io;
    });
  },

  /**
   * Get the SocketIO server for a connection.
   *
   * @param name
   * @return {*}
   */
  connection (name) {
    if (!this._connections.hasOwnProperty (name))
      throw Error (`The socket.io connection ${name} does not exist`);

    return this._connections[name];
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
