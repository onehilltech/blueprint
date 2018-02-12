const {waterfall} = require ('async');
const FirebaseDevice = require ('../../../models/firebase-device');

const {
  errors: { HttpError }
} = require ('@onehilltech/blueprint');

module.exports = function (req, callback) {
  waterfall ([
    function (callback) {
      let authorization = req.get ('authorization');

      if (!authorization)
        return callback (new HttpError (400, 'missing_token', 'The request is missing the device token.'));

      let [protocol,token] = authorization.split (' ');

      if (protocol !== 'Bearer')
        return callback (new HttpError (400, 'bad_protocol', 'The request has an unsupported authorization protocol.'));

      FirebaseDevice.verifyDeviceToken (token, callback);
    },

    function (payload, callback) {
      FirebaseDevice.findById (payload.jti, callback);
    },

    function (device, callback) {
      if (!device)
        return callback (null, false, 'The device for the request does not exist.');

      req.device = device;

      return callback (null, true);
    }
  ], callback);
};