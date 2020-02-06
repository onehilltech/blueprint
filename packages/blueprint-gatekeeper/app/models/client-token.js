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
const { Schema }  = require ('@onehilltech/blueprint-mongodb');
const AccessToken = require ('./access-token');

const {
  schema: {
    options: {
      discriminatorKey
    }
  }
} = AccessToken;

const options = require ('./-common-options') ({discriminatorKey});
options.softDelete = true;

// Define the schema for the client token.

const schema = new Schema ({ }, options);

schema.methods.serialize = function (tokenGenerator) {
  return props ({
    access_token: (() => {
      const payload = Object.assign ({}, this.payload,{ scope: this.scope });
      const options = { jwtid: this.id };

      if (this.expiration)
        payload.exp = Math.floor (this.expiration.getTime () / 1000);

      if (this.audience)
        options.audience = this.audience;

      if (this.subject)
        options.subject = this.subject;

      return tokenGenerator.generateToken (payload, options);
    })()
  });
};

schema.methods.serializeSync = function (tokenGenerator) {
  return {
    access_token: (() => {
      const payload = Object.assign ({}, this.payload,{ scope: this.scope });
      const options = { jwtid: this.id };

      if (this.expiration)
        payload.exp = Math.floor (this.expiration.getTime () / 1000);

      if (this.audience)
        options.audience = this.audience;

      if (this.subject)
        options.subject = this.subject;

      return tokenGenerator.generateTokenSync (payload, options);
    }) ()
  };
};

module.exports = AccessToken.discriminator ('client_token', schema);
