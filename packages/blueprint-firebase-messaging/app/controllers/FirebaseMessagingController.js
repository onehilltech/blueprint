const blueprint = require ('@onehilltech/blueprint');
const mongodb   = require ('@onehilltech/blueprint-mongodb');
const async     = require ('async');
const jwt       = require ('jsonwebtoken');
const FirebaseDevice = require ('../models/firebase-device');

const {
  ResourceController
} = mongodb;

const {
  messaging,
  errors: {
    HttpError
  }
} = blueprint;

const {
  waterfall
} = async;


function FirebaseMessagingController () {
  ResourceController.call (this, {namespace: 'firebase', model: FirebaseDevice});
}

blueprint.controller (FirebaseMessagingController, ResourceController);

/**
 * Register a new Firebase instance with the server.
 */
FirebaseMessagingController.prototype.create = function () {
  const opts = {
    on: {
      prepareDocument (req, doc, callback) {
        if (doc.token)
          delete doc.token;

        doc.client = req.user._id;

        return callback (null, doc);
      }
    }
  };

  return ResourceController.prototype.create.call (this, opts);
};

/**
 * Remove a device from the database. Once the device has been removed, it can no
 * longer be communicated with.
 */
FirebaseMessagingController.prototype.removeDevice = function () {
  return (req, res, callback) => {
    async.waterfall ([
      function (callback) {
        req.device.remove (callback);
      },

      function (device, callback) {
        res.status (200).json (true);
        return callback (null);
      }
    ], callback);
  }
};

/**
 * Refresh the token that allows Firebase to communicate with the device.
 */
FirebaseMessagingController.prototype.refreshToken = function () {
  return {
    validate: {
      'device.token': {
        in: 'body',
        notEmpty: {errorMessage: 'Missing the refresh token.'}
      },
    },

    execute (req, res, callback) {
      let {device} = req;

      waterfall ([
        (callback) => {
          device.token = req.body.device.token;
          device.save (callback);
        },

        function (device, n, callback) {
          if (!device)
            return callback (new HttpError (400, 'missing_device', 'The device no longer exists.'));

          if (n !== 1)
            return callback (new HttpError (500, 'update_failed', 'Failed to refresh the token for the device.'));

          res.status (200).json ({device: device});

          return callback (null);
        }
      ], callback);
    },
  }
};

/**
 * Claim an existing device.
 */
FirebaseMessagingController.prototype.claimDevice = function () {
  return {
    validate: {
      'device.device': {
        notEmpty: { errorMessage: 'The device.device is missing the device token.' }
      }
    },

    execute (req, res, callback) {
      waterfall([
        (callback) => {
          let deviceToken = req.body.device.device;
          FirebaseDevice.verifyDeviceToken (deviceToken, callback);
        },

        function (payload, callback) {
          const update = {user: req.user._id};

          FirebaseDevice.findByIdAndUpdate (payload.jti, update, {new: true}, callback);
        },

        function (device, callback) {
          if (!device)
            return callback (new HttpError (400, 'not_found', 'The device does not exist.'));

          let ret = device.toObject ();
          delete ret.id;

          res.status (200).json ({device: ret});

          return callback (null);
        }
      ], callback);
    }
  };
};

FirebaseMessagingController.prototype.unclaimDevice = function () {
  return {
    validate: {
      'device.device': {
        notEmpty: { errorMessage: 'The device.device is missing the device token.' }
      }
    },

    execute (req, res, callback) {
      waterfall([
        (callback) => {
          let deviceToken = req.body.device.device;
          FirebaseDevice.verifyDeviceToken (deviceToken, callback);
        },

        function (payload, callback) {
          const selection = {_id: payload.jti, user: req.user._id};
          const update = {$unset: {user: ''}};

          FirebaseDevice.findOneAndUpdate (selection, update, {new: true}, callback);
        },

        function (device, callback) {
          if (!device)
            return callback (new HttpError (400, 'not_found', 'The device does not exist.'));

          let ret = device.toObject ();
          delete ret.id;

          res.status (200).json ({device: ret});

          return callback (null);
        }
      ], callback);
    }
  };
};

module.exports = FirebaseMessagingController;
