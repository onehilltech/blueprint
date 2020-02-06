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

const mongodb   = require ('@onehilltech/blueprint-mongodb');

const {
  Schema: {
    Types: { ref, ObjectId }
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
options.softDelete = true;

// Define the schema for the user token.

const schema = new mongodb.Schema ({
  /// Account that owns the token.
  account: ref (Account, {required: true, index: true}),

  /// Optional refresh token for the user.
  refresh_token: {type: ObjectId, index: true, unique: true, sparse: true}
}, options);

schema.methods.serialize = function (tokenGenerator, refreshTokenGenerator) {
  return props ({
    access_token: (() => {
      const payload = Object.assign ({}, this.payload,{ scope: this.scope });
      const options = { jwtid: this.id };

      if (this.expiration)
        payload.exp = Math.floor (this.expiration.getTime () / 1000);

      if (this.origin)
        payload.origin = this.origin;

      if (this.audience)
        options.audience = this.audience;

      if (this.subject)
        options.subject = this.subject;

      return tokenGenerator.generateToken (payload, options);
    })(),

    refresh_token: (() => {
      if (!this.refresh_token)
        return Promise.resolve (undefined);

      // Refresh tokens never expire.

      const payload = {  };
      const options = { jwtid: this.refresh_token.toString ()};

      if (this.origin)
        payload.origin = this.origin;

      return refreshTokenGenerator.generateToken (payload, options);
    })()
  });
};

schema.methods.serializeSync = function (tokenGenerator, refreshTokenGenerator) {
  return  {
    access_token: (() => {
      const payload = Object.assign ({}, this.payload,{ scope: this.scope });
      const options = { jwtid: this.id };

      if (this.expiration)
        payload.exp = Math.floor (this.expiration.getTime () / 1000);

      if (this.origin)
        payload.origin = this.origin;

      if (this.audience)
        options.audience = this.audience;

      if (this.subject)
        options.subject = this.subject;

      return tokenGenerator.generateTokenSync ({ scope: this.scope }, options);
    }) (),

    refresh_token: (() => {
      if (!this.refresh_token)
        return undefined;

      let options = { jwtid: this.refresh_token.toString () };
      let payload = {};

      if (this.origin)
        payload.origin = this.origin;

      return refreshTokenGenerator.generateTokenSync (payload, options);
    }) ()
  };
};

module.exports = AccessToken.discriminator ('user_token', schema);
