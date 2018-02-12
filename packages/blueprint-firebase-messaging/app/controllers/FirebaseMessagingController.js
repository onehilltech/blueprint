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
  ResourceController.call (this, {model: FirebaseDevice});
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

        if (doc.user)
          delete doc.user;

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

FirebaseMessagingController.prototype.claimDevice = function () {
  return {
    validate: {
      claim_ticket: {
        notEmpty: { errorMessage: 'You must provide a claim ticket.' }
      }
    },

    execute (req, res, callback) {
      waterfall([
        function (callback) {
          let claimTicket = req.body.claim_ticket;
          let options = {issuer: 'cloud-messaging', audience: 'user', subject: 'claim-ticket'};
          let cert = claimTicketOptions.secret || claimTicketOptions.publicKey;

          jwt.verify (claimTicket, cert, options, callback);
        },

        function (payload, callback) {
          let query = {_id: payload.jti, device: req.params.deviceId};
          let update = {owner: req.user._id};

          CloudToken.findOneAndUpdate (query, update, callback);
        },

        function (token, callback) {
          res.status (200).json (!!token);
          return callback (null);
        }
      ], callback);
    }
  };
};

FirebaseMessagingController.prototype.unclaimDevice = function () {
  return {
    execute (req, res, callback) {
      waterfall([
        function (callback) {
          let query = {device: req.params.deviceId, owner: req.user._id};

          CloudToken.findOneAndRemove (query, callback);
        },

        function (doc, callback) {
          if (!doc)
            return callback (new HttpError (404, 'not_found', 'Device registration does not exist.'));

          res.status (200).json (true);
          return callback (null);
        }
      ], callback);
    }
  };
};

module.exports = FirebaseMessagingController;
