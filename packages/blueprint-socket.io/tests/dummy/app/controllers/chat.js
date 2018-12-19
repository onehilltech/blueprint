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

const { Action, Controller } = require ('@onehilltech/blueprint');
const { io } = require ('../../../../lib');

module.exports = Controller.extend ({
  /// Bound to the insecure Socket.IO connection.
  insecure: io ().of ('/'),
  defaultNsp: io ('insecure').of ('/'),

  /**
   * Force emit a message to all participants.
   */
  emit () {
    return Action.extend ({

      execute (req, res) {
        const { message } = req.query;

        // Emit an event to all clients on the connection.
        this.controller.defaultNsp.emit ('chat message', message);

        res.status (200).json (true);
      }
    })
  }
});
