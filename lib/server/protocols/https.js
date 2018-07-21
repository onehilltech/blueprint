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
const https = require ('https');
const { merge, omit } = require ('lodash');

/**
 * @class Https
 *
 * Protocol implementation for Https.
 */
const Https = Protocol.extend ({
  method1 () {

  }
});

/**
 * Factory method for creating a new Https protocol.
 *
 * @param app
 * @param opts
 * @returns {*}
 */

Https.createProtocol = function (app, opts) {
  let server = https.createServer (opts.options, app);
  let options = merge ({port: 443}, omit (opts, ['options']));

  return new Https ({server, options});
};

module.exports = Https;
