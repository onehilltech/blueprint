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

const { PropertyDescriptor } = require ('base-object');

/**
 * A descriptor for binding a Socket.IO namespace to a property.
 */
class NamespaceDescriptor extends PropertyDescriptor {
  constructor (socket, nsp) {
    super ();

    this.socket = socket;
    this.nsp = nsp || '/';
  }

  defineProperty (obj, name) {
    const connectionName = this.socket.connection || name;
    const nsp = this.nsp;

    Object.defineProperty (obj, name, {
      get () {
        const io = this.app.lookup ('service:io');
        const socket = io.connection (connectionName);

        return socket.of (nsp);
      }
    });
  }
}

module.exports = NamespaceDescriptor;
