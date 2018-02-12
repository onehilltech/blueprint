const {expect} = require ('chai');
const FirebaseDevice = require ('../../../../app/models/firebase-device');
const {waterfall} = require ('async');

describe ('app | models | FirebaseDevice', function () {
  describe ('toObject', function () {
    it ('should create an object with virtual attributes', function () {
      let device = new FirebaseDevice ({device: '1234567890'});
      let obj = device.toObject ();

      expect (obj).to.have.property ('device_token');
    });

    it ('should have device token that contains device id', function (done) {
      let device = new FirebaseDevice ({device: '1234567890'});
      let obj = device.toObject ();

      waterfall ([
        function (callback) {
          FirebaseDevice.verifyDeviceToken (obj.device_token, callback);
        },

        function (payload, callback) {
          expect (payload).to.have.property ('iss', 'firebase-messaging');
          expect (payload).to.have.property ('sub', 'firebase.device');
          expect (payload).to.have.property ('jti', device.id);

          return callback (null);
        }
      ], done)
    })
  });
});
