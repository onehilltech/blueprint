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
const fs = require ('fs-extra');
const { spawn } = require('child_process');

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

  /// The default identity of the application.
  defaultIdentity: null,

  /**
   * Configure the dfinity service.
   */
  async configure () {
    const { dfinity } = this.app.configs;

    if (!dfinity)
      return;

    // We need to make sure the dfinity application directory exists.
    await fs.ensureDir (`${this.app.tempPath}/dfinity`);

    // Load the default identity for the application. The private key takes precedence
    // over the seed. Additionally, you can opt-out of generating the default private key.

    const { privateKey = true, phrase } = dfinity;

    if (privateKey !== false) {
      // Load the default identity into memory. If the private key is a string, then
      // it is the location of the private key.

      if (isString (privateKey))
        this.defaultIdentity = await this._loadIdentity (`key://${privateKey}`);
      else
        this.defaultIdentity = await this._loadDefaultIdentity ();
    }
    else if (phrase) {
      this.defaultIdentity = await this._loadIdentity (`phrase://${seed}`);
    }

    // Load the agents and canister ids into memory.
    await Promise.all (map (dfinity.agents, async (options, name) => {
      this.agents[name] = await this.createHttpAgent (options);
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

    const { privateKey, phrase } = options;

    if (privateKey || phrase) {
      if (privateKey) {
        // Load the identity from a private key, and delete the privateKey option.
        opts.identity = this._loadIdentity (`key://${privateKey}`);
        delete opts.privateKey;
      }
      else {
        // Load the identity from a seed file, and delete the seed option.
        opts.identity = this._loadIdentity (`phrase://${phrase}`);
        delete opts.seed;
      }
    }
    else {
      opts.identity = this.defaultIdentity;
    }

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
      throw new Error (`The identity protocol ${protocol} is not supported.`);
    }
  },

  /**
   * Helper method that lookups an existing agent.
   *
   * @param name                Name of the agent
   * @param failIfNotFound      Fail if not found
   * @private
   */
  _lookupAgent (name, failIfNotFound = true) {
    const agent = this.agents[name];

    if (!agent && failIfNotFound)
      throw new Error (`The agent ${name} does not exist.`);

    return agent;
  },

  /**
   * Load the local identify for the application.
   *
   * @private
   */
  async _loadDefaultIdentity () {
    // First, let's see if there is a local identity file.
    const privateKeyFile = path.resolve (this.app.tempPath, 'dfinity/identity.pem');
    const exists = await fs.pathExists (privateKeyFile);
    const descriptor = `key://${privateKeyFile}`;

    if (exists)
      return this._loadIdentity (descriptor);

    const privateKeyBuffer = await generatePrivateKey ();
    await fs.writeFile (privateKeyFile, privateKeyBuffer);

    // The private key file does not exist. We need to create a new one for this node
    // instance since we need to make sure each instance has a unique identity. We
    // are going to use openssl to generate the private key.

    return this._loadIdentity (descriptor);
  },

  defaultPrivateKeyFile: computed ({
    get () {
      return path.resolve (this.app.tempPath, 'dfinity/identity.pem');
    }
  }),

  async _generatePrivateKey (location) {
    const privateKey = await generatePrivateKey ();
  }
});

/**
 * Helper function that generate a private key for the node application.
 */
function generatePrivateKey () {
  return new Promise ((resolve, reject) => {
    const openssl = spawn ('openssl', 'ecparam -name secp256k1 -genkey -noout'.split (' '));

    const buffers = [];

    openssl.stdout.on ('data', (data) => buffers.push (data));
    openssl.stderr.on ('data', (data) => reject (new Error (data)));
    openssl.on ('close', (code) => resolve (Buffer.concat (buffers)));
  });
}

