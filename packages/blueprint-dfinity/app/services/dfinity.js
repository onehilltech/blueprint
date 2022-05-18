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

const { Service, env, computed, Loader } = require ('@onehilltech/blueprint');
const { identity } = require ('../../lib');

const { forOwn, map, get, isString } = require ('lodash');
const { HttpAgent } = require('@dfinity/agent');
const path = require ('path');

// set the globals
global.fetch = require ('node-fetch');
global.TextEncoder = require ('util').TextEncoder;

const ACTORS_DIRNAME = 'actors';

const IDENTITY_KEY_PROTOCOL = 'key';
const IDENTITY_PHRASE_PROTOCOL = 'phrase';

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
    this._idls = {}
  },

  /// A collection of named agents for connecting to the Internet Computer.
  agents: null,

  /// A collection of named canisters for connecting ot the Internet Computer.
  canisters: null,

  /**
   * Configure the dfinity service.
   */
  async configure () {
    const { dfinity } = this.app.configs;

    // Load the agents and canister ids into memory.
    await (map (dfinity.agents, async (agentOptions, name) => {
      this.agents[name] = await this.createHttpAgent (agentOptions);
    }));

    forOwn (dfinity.canisters, (canisterId, name) => {
      this.canisters[name] = canisterId;
    });

    // Now, load the idl factories into memory.
    await this._loadActorFactories ();
  },

  actorsPath: computed ({
    get () {
      return path.resolve (this.app.appPath, ACTORS_DIRNAME);
    }
  }),

  /**
   * Create a HttpAgent from the options.
   *
   * @param options             Http agent options
   * @param fetchRootKey        Fetch root key (only applies in non-production environments)
   */
  async createHttpAgent (options, fetchRootKey = true) {
    const opts = Object.assign ({}, options);

    // The source agent can be a named agent. If it is a named agent, replace the
    // name (or string) with an agent.

    if (opts.source && isString (opts.source))
      opts.source = this._lookupAgent (opts.source);

    // Load the identity if there is one defined. The identity could be a private
    // key or a seed phrase.

    if (opts.identity && isString (opts.identity))
      opts.identity = await this._loadIdentity (opts.identity);

    const agent = new HttpAgent (opts);

    // Needed for update calls on local dev env, shouldn't be used in production!
    if (env !== 'production' && fetchRootKey)
      await agent.fetchRootKey ();

    return agent;
  },

  /**
   * Create an instance of an actor.
   *
   * @param idlType
   * @param options
   */
  createInstance (idlType, options = {}) {
    const factory = get (this._idls, idlType);

    if (!factory)
      throw new Error (`${idlType} actor does not exist.`);

    if (!options.canisterId) {
      options.canisterId = this.canisters.$default;
    }
    else {
      // This can either be a valid canister id, or a named canister. To be a valid
      // canister id, the id must have 5 parts. This is probably not the best way to
      // check for this, but it suffices for now.

      if (options.canisterId.split ('-').length !== 5)
        options.canisterId = this.canisters[options.canisterId];
    }

    if (!options.agent) {
      // There is no agent. We are going to use the default agent.
      options.agent = this.agents.$default;
    }
    else if (isString (options.agent)) {
      options.agent = this.agents[options.agent];
    }

    if (!options.canisterId)
      throw new Error ('You must define a canisterId, or define a default canisterId in app/configs/dfinity.js');

    if (!options.agent)
      throw new Error ('You must define an agent, or define a default canisterId in app/configs/dfinity.js');

    return factory.createInstance (options);
  },

  /// The loaded IDL definitions for defined actors.
  _idls: null,

  /**
   * Load the IDL factories into memory.
   *
   * @private
   */
  async _loadActorFactories () {
    const loader = new Loader ();

    this._idls = await loader.load ({
      dirname: this.actorsPath,
      resolve (Actor) {
        return new Actor ();
      }
    });
  },

  /**
   * Loads the identify to be used in the http agent.
   *
   * @param descriptor
   * @return {Promise<*>}
   * @private
   */
  async _loadIdentity (descriptor) {
    // Split the identity string into a protocol and filename. If there is no
    // protocol and filename, then we can assume the string is some kind of
    // directly supported identity string, which should not work.

    const parts = descriptor.split ('://');

    if (parts.length !== 2)
      return descriptor;

    let [ protocol, filename ] = parts;

    if (protocol === IDENTITY_KEY_PROTOCOL) {
      // The identity is a private key.
      if (!path.isAbsolute (filename))
        filename = path.resolve (this.app.appPath, filename);

      return await identity.fromKeyFile (filename);
    }
    else if (protocol === IDENTITY_PHRASE_PROTOCOL) {
      // The identity is a seed phrase.
      if (!path.isAbsolute (filename))
        filename = path.resolve (this.app.appPath, filename);

      return await identity.fromSeedFile (filename);
    }
    else {
      throw new Error (`The identify protocol ${protocol} is not supported.`);
    }
  },

  _lookupAgent (name, failIfNotFound = true) {
    const agent = this.agents[name];

    if (!agent && failIfNotFound)
      throw new Error (`The agent ${name} does not exist.`);

    return agent;
  }
});
