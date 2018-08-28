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

const { Service } = require ('@onehilltech/blueprint');
const { forOwn } = require ('lodash');
const compression = require ('compression');

module.exports = Service.extend ({
  configure () {
    // Load the compression configuration, and configure the expression
    // application according to the configuration.
    const config = this.app.lookup ('config:compression');

    if (!config)
      return;

    const express = this.app.server.express;

    if (config.app) {
      let options = config.app === true ? {} : config.app;
      express.use (compression (options));
    }

    forOwn (config.paths, (options, path) => {
      let hash = options === true ? {} : options;
      express.use (path, compression (hash));
    });
  }
});
