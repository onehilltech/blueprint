/*
 * Copyright (c) 2022 One Hill Technologies, LLC
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
const { HttpAgent } = require('@dfinity/agent');

// set the globals
global.fetch = require ('node-fetch');
global.TextEncoder = require ('util').TextEncoder;

/**
 * @class dfinity
 *
 * The dfinity service is the bridge between a Blueprint application and the Internet
 * Computer. The service contains several registries that it easier to locate entities
 * needed to bootstrap Internet Computer actors.
 */
module.exports = Service.extend ({
  init () {
    this._super.call (this, ...arguments);

    this.canisters = {};
    this.agents = {};
  },

  /// A collection of named agents for connecting to the Internet Computer.
  agents: null,

  /// A collection of named canisters for connecting ot the Internet Computer.
  canisters: null,

  /**
   * Configure the dfinity service.
   */
  configure () {
    const { dfinity } = this.app.configs;

    // Load the agents and canister ids into memory.
    forOwn (dfinity.agents, (agentOptions, name) => {
      this.agents[name] = new HttpAgent (agentOptions);
    });

    forOwn (dfinity.canisters, (canisterId, name) => {
      this.canisters[name] = canisterId;
    });
  }
});
