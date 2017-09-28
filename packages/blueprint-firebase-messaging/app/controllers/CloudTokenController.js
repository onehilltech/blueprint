'use strict';

let blueprint  = require ('@onehilltech/blueprint')
  , mongodb    = require ('@onehilltech/blueprint-mongodb')
  , async      = require ('async')
  , CloudToken = require ('../models/CloudToken')
  , ResourceController = mongodb.ResourceController
  , HttpError          = blueprint.errors.HttpError
  ;

function CloudTokenController () {
  ResourceController.call (this, {name: 'token', model: CloudToken});
}

blueprint.controller (CloudTokenController, ResourceController);

module.exports = CloudTokenController;

CloudTokenController.prototype.registerToken = function () {
  return {
    validate: {
      device: {
        notEmpty: { errorMessage: 'Missing device id parameter.' }
      },

      token: {
        notEmpty: { errorMessage: 'Missing token parameter.'}
      }
    },

    execute: function (req, res, callback) {
      async.waterfall ([
        function (callback) {
          let query = {device: req.body.device};
          let update = {device: req.body.device, token: req.body.token};
          let options = {upsert: true, new: true};

          // If the request if from a user, we can go ahead and allow the user to claim
          // this token.

          if (req.accessToken.kind === 'user_token')
            update.owner = req.accessToken.account._id;

          CloudToken.findOneAndUpdate (query, update, options, callback);
        },

        function (token, callback) {
          res.status (200).json (!!token);
          return callback (null);
        }
      ], callback);
    },
  }
};

CloudTokenController.prototype.claimDevice = function () {
  return function (req, res, callback) {
    async.waterfall ([
      function (callback) {
        let query = {device: req.params.deviceId};
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
