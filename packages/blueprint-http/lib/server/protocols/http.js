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

const Protocol = require ('../protocol');
const http = require ('http');
const _ = require ('lodash');

/**
 * @class Http
 *
 * Protocol implementation for Http.
 */
const Http = Protocol.extend ({

});

/**
 * Factory method for creating a new Http protocol.
 *
 * @param app
 * @param opts
 * @returns {*}
 */
Http.createProtocol = function (app, opts) {
  let server = http.createServer (app);
  let options = _.merge ({port: 80}, opts);

  return new Http ({server, options});
};

module.exports = Http;
