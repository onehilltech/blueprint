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
const SocketIO = require ('socket.io');

const debug = require ('debug')('blueprint-socketio:service:io');

const DEFAULT_NAMESPACE = '/';

/**
 * The service that manages connections for SocketIO.
 */
module.exports = Service.extend ({
  /// Collection of protocols used in SocketIO
  _protocols: null,

  configure () {
    const protocols = blueprint.app.server._protocols;

    this._protocols = mapValues (protocols, (protocol, name) => {
      debug (`establishing socket.io on ${name}`);
      return SocketIO (protocol.server);
    });
  },

  start () {

  }
});
