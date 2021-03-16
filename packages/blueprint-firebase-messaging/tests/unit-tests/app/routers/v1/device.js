
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

const { request } = require ('@onehilltech/blueprint-testing');
const { seed, Types: { ObjectId } } = require ('@onehilltech/blueprint-mongodb');

describe ('app | routers | v1 | firebase-device', function () {
  describe ('/v1/devices', function () {
    describe ('POST', function () {
      it ('should register a device', function () {
        const {accounts: [account], native: [client]} = seed ();
        const device = {_id: new ObjectId ().toString (), token: 'abcdefgh'};

        return request ()
          .post ('/v1/devices')
          .withUserToken (0)
          .send ({device})
          .expect (200, { device: Object.assign ({}, device, {__v: 0, account: account.id, client: client.id})});
      });
    });
  });

  describe ('/v1/firebase/:deviceId', function () {
    describe ('DELETE', function () {
      it ('should remove a device', function () {
        const { devices: [device] } = seed ();

        return request ()
          .delete (`/v1/devices/${device.id}`)
          .withUserToken (0)
          .expect (200, 'true');
      });

      it ('should not allow another account to remove device', function () {
        const { devices: [device] } = seed ();

        return request ()
          .delete (`/v1/devices/${device.id}`)
          .withUserToken (1)
          .expect (403, {
            "errors": [
              {
                "code": "invalid_owner",
                "detail": "You are not the owner of the device.",
                "status": "403"
              }
            ]
          });
      });
    });
  });
});