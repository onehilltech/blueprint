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

const { props } = require ('bluebird');
const blueprint = require ('@onehilltech/blueprint');
const {Schema}  = require ('@onehilltech/blueprint-mongodb');
const AccessToken = require ('./access-token');

const {
  schema: {
    options: {
      discriminatorKey
    }
  }
} = AccessToken;

const options = require ('./-common-options') ({discriminatorKey});

const gatekeeper = blueprint.lookup ('service:gatekeeper');
const accessTokenGenerator = gatekeeper.getTokenGenerator ('gatekeeper:access_token');

// Define the schema for the client token.

const schema = new Schema ({ }, options);

schema.methods.serialize = function () {
  return props ({
    access_token: (() => {
      const payload = { scope: this.scope };
      const options = { jwtid: this.id };

      if (this.origin)
        options.audience = this.origin;

      return accessTokenGenerator.generateTokenSync (payload, options);
    })()
  });
};

schema.methods.serializeSync = function () {
  return {
    access_token: (() => {
      const payload = { scope: this.scope };
      const options = { jwtid: this.id };

      if (this.origin)
        options.audience = this.origin;

      return accessTokenGenerator.generateTokenSync (payload, options);

    }) ()
  };
};

module.exports = AccessToken.discriminator ('client_token', schema);
