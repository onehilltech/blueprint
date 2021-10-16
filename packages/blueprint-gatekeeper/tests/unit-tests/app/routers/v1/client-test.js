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

const { lean, seed, Types: { ObjectId } } = require ('@onehilltech/blueprint-mongodb');
const { request } = require ('@onehilltech/blueprint-testing');

describe ('app | routers | client', function () {
  describe ('/v1/clients', function () {
    describe ('POST', function () {
      it ('should create a client', function () {
        const client = {_id: new ObjectId (), type: 'native', name: 'test-client', email: 'test-client@contact.me', client_secret: 'test-client'};

        return request ()
          .post ('/v1/clients')
          .withClientToken (0)
          .send ({client: client})
          .expect (200, {client: lean (Object.assign (client, {enabled: true, scope: [], allow: [], deny: [], verify_expires_in: '7 days'}))});
      });
    });
  });

  describe ('/v1/clients/:clientId', function () {
    describe ('PUT', function () {
      it ('should update the client', function () {
        const {native} = seed ('$default');
        const client = native[0];
        const update = {name: 'updated-name'};

        return request ()
          .put (`/v1/clients/${client.id}`)
          .withClientToken (0)
          .send ({client: update})
          .expect (200, {client: Object.assign (client.lean (), update)});
      });
    });

    describe ('DELETE', function () {
      it ('should delete a client', function () {
        const {native} = seed ('$default');
        const client = native[0];

        return request ()
          .delete (`/v1/clients/${client.id}`)
          .withClientToken (0)
          .expect (200, 'true');
      });
    });
  });
});
