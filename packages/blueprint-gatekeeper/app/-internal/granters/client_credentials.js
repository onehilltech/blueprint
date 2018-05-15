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
const { model, service, } = require ('@onehilltech/blueprint');

/**
 * @class ClientCredentials
 *
 * Granter for the client_credentials.
 */
module.exports = Granter.extend ({
  name: 'client_credentials',

  ClientToken: model ('client-token'),

  recaptcha: service (),

  /**
   * Create a token for the request.
   *
   * @param req
   */
  createToken (req) {
    const {gatekeeperClient} = req;

    const doc = {
      client: gatekeeperClient._id,
      scope : gatekeeperClient.scope,
    };

    const origin = req.get ('origin');

    if (!!origin)
      doc.origin = origin;

    return this.ClientToken.create (doc);
  }
});
