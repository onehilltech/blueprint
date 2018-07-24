
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
const { request } = require ('@onehilltech/blueprint-testing');

const {expect}  = require ('chai');
const {seed, Types: {ObjectId}} = require ('@onehilltech/blueprint-mongodb');

describe.only ('app | routers | v1 | firebase-messaging', function () {
  function generateDeviceToken (device) {
    return blueprint.lookup ('service:fcm').generateToken (device);
  }

  describe ('/v1/firebase/devices', function () {
    describe ('POST', function () {
      it ('should register a device', function () {
        const _id = new ObjectId ();
        const device = {_id: _id.toString (), device: '1234567890'};
        const {native} = seed ();

        return request ()
          .post ('/v1/firebase/devices')
          .withClientToken (0)
          .send ({device})
          .expect (200, {device: Object.assign ({client: native[0].id}, device)});
      });

      it ('should register a device with token', function () {
        const FirebaseDevice = blueprint.lookup ('model:firebase-device');
        let device = {device: '0987654321', token: 'aabbccdd'};

        return request ()
          .post ('/v1/firebase/devices')
          .withClientToken (0)
          .send ({device})
          .expect (200)
          .then (res => {
            return FirebaseDevice.findOne ({device: device.device}).then (model => {
              expect (res.body.device).to.eql (model.lean ());
            })
          });
      });
    });

    describe ('DELETE', function () {
      it ('should remove a device', function () {
        const {devices} = seed ();

        return generateDeviceToken (devices[0]).then (token => {
          return request ()
            .delete ('/v1/firebase/devices')
            .set ('Authorization', `Bearer ${token}`)
            .expect (200, 'true');
        })
      });

      it ('should not permit double removal of device', function () {
        const {devices} = seed ();

        return generateDeviceToken (devices[0])
          .then (token => {
            return request ()
              .delete ('/v1/firebase/devices')
              .set ('Authorization', `Bearer ${token}`)
              .expect (200, 'true')
              .then (() => token)
          })
          .then (token => {
            return request ()
              .delete ('/v1/firebase/devices')
              .set ('Authorization', `Bearer ${token}`)
              .expect (403, { errors:
                  [ { code: 'invalid_device',
                    detail: 'The device for the request does not exist.',
                    status: '403' } ] });
          });
      })
    });
  });

  describe ('/v1/firebase/devices/tokens', function () {
    describe ('POST', function () {
      it ('should initialize the device token', function () {
        const {devices} = seed ();
        const device = devices[3];

        return generateDeviceToken (device).then (token => {
          const expected = device.lean ();
          expected.token = 'abc';

          return request ()
            .post ('/v1/firebase/devices/tokens')
            .send ({device: {token: 'abc'}})
            .set ('Authorization', `Bearer ${token}`)
            .expect (200, {device: expected});
        });
      });

      it ('should refresh the existing device token', function () {
        const {devices} = seed ();
        const device = devices[0];

        const expected = device.lean ();
        expected.token = 'abc';

        return generateDeviceToken (device).then (token => {
          return request ()
            .post ('/v1/firebase/devices/tokens')
            .send ({device: {token: 'abc'}})
            .set ('Authorization', `Bearer ${token}`)
            .expect (200, {device: expected});
        });
      });
    });
  });

  describe ('/v1/firebase/devices/claims', function () {
    describe ('POST', function () {
      it ('should claim an unclaimed device', function () {
        const {devices,accounts} = seed ();
        const device = devices[0];
        const account = accounts[0];

        let expected = device.lean ();
        delete expected.id;

        expected.user = account.id;

        return generateDeviceToken (device).then (token => {
          return request ()
            .post ('/v1/firebase/devices/claims')
            .withUserToken (0)
            .send ({device: {device: token}})
            .expect (200, {device: expected});
        });
      });

      it ('should not allow client to claim a device', function () {
        const {devices} = seed ();
        const device = devices[0];

        return generateDeviceToken (device).then (token => {
          return request ()
            .post ('/v1/firebase/devices/claims')
            .withClientToken (0)
            .send ({device: {device: token}})
            .expect (403, { errors:
                [ { code: 'unauthorized_claim',
                  detail: 'The request is not authorized to manage the device claim.',
                  status: '403' } ] });
        });
      });
    });

    describe ('DELETE', function () {
      it ('should unclaim an claimed device', function () {
        const {devices} = seed ();
        const device = devices[4];

        let expected = device.lean ();
        delete expected.id;
        delete expected.user;

        return generateDeviceToken (device).then (token => {
          return request ()
            .delete ('/v1/firebase/devices/claims')
            .withUserToken (0)
            .send ({device: {device: token}})
            .expect (200, {device: expected});
        });
      });

      it ('should not allow client to unclaim a device', function () {
        const {devices} = seed ();
        const device = devices[0];

        return generateDeviceToken (device).then (token => {
          return request ()
            .delete ('/v1/firebase/devices/claims')
            .withClientToken (0)
            .send ({device: {device: token}})
            .expect (403, { errors:
                [ { code: 'unauthorized_claim',
                  detail: 'The request is not authorized to manage the device claim.',
                  status: '403' } ] });
        });
      });

      it ('should not allow user to unclaim another device', function () {
        const {devices} = seed ();
        const device = devices[0];

        return generateDeviceToken (device).then (token => {
          return request ()
            .delete ('/v1/firebase/devices/claims')
            .withUserToken (0)
            .send ({device: {device: token}})
            .expect (400, { errors:
                [ { code: 'not_found',
                  detail: 'The device does not exist, or the user does not own the device.',
                  status: '400' } ] });
        });
      });
    });

  });
});