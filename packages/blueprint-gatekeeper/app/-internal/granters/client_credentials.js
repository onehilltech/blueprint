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

const Granter = require ('../granter');
const { model } = require ('@onehilltech/blueprint');
const moment = require ('moment');
const { union } = require ('lodash');
/**
 * @class ClientCredentials
 *
 * Granter for the client_credentials.
 */
module.exports = Granter.extend ({
  name: 'client_credentials',

  ClientToken: model ('client-token'),

  /**
   * Create a token for the request.
   *
   * @param req
   */
  onCreateToken (req) {
    const {
      gatekeeperClient: client,
      body: { subject, audience, scope = [] }
    } = req;

    const doc = {
      client: client._id,
      scope: union (client.scope, scope),
    };

    if (!!client.expiration) {
      // Compute the expiration date for the access token. The expiration statement
      // in the client is a a relative time phrase (i.e., 1 day, 60 seconds, etc).

      let parts = client.expiration.split (' ');
      doc.expiration = moment ().add (...parts).toDate ();
    }

    const origin = req.get ('origin');

    if (!!origin)
      doc.origin = origin;

    if (!!audience)
      doc.audience = audience;

    if (!!subject)
      doc.subject = subject;

    return this.ClientToken.create (doc);
  }
});
