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
const mongodb   = require ('@onehilltech/blueprint-mongodb');

const {
  Schema: {
    Types: {
      ObjectId
    }
  }
} = require ('@onehilltech/blueprint-mongodb');

const AccessToken = require ('./access-token');
const Account     = require ('./account');

const { props } = require ('bluebird');

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

// Define the schema for the user token.

const schema = new mongodb.Schema ({
  /// Account that owns the token.
  account: {type: ObjectId, ref: Account.modelName, index: true},

  /// Optional refresh token for the user.
  refresh_token: {type: ObjectId, index: true, unique: true, sparse: true}
}, options);

schema.methods.serialize = function () {
  return props ({
    access_token: (() => {
      const payload = { scope: this.scope };
      const options = { jwtid: this.id };

      if (this.origin)
        options.audience = this.origin;

      return accessTokenGenerator.generateToken (payload, options);
    })(),

    refresh_token: (() => {
      if (!this.refresh_token)
        return callback (null);

      const payload = {  };
      const options = { jwtid: this.refresh_token.toString () };

      if (this.origin)
        options.audience = this.origin;

      return accessTokenGenerator.generateToken (payload, options);
    })()
  });
};

schema.methods.serializeSync = function () {
  return  {
    access_token: (() => {
      let options = {jwtid: this.id};

      if (this.origin)
        options.audience = this.origin;

      return accessTokenGenerator.generateTokenSync ({ scope: this.scope }, options);
    }) (),

    refresh_token: (() => {
      if (!this.refresh_token)
        return undefined;

      let options = {jwtid: this.refresh_token.toString ()};

      if (this.origin)
        option.audience = this.origin;

      return accessTokenGenerator.generateTokenSync ({}, options);
    }) ()
  };
};

module.exports = AccessToken.discriminator ('user_token', schema);
