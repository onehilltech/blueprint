'use strict';

var blueprint          = require ('@onehilltech/blueprint')
  , mongodb            = require ('@onehilltech/blueprint-mongodb')
  , async              = require ('async')
  , ResourceController = mongodb.ResourceController
  , HttpError          = blueprint.errors.HttpError
  ;

var CloudToken = require ('../models/CloudToken')
  ;

function CloudTokenController () {
  ResourceController.call (this, {name: 'token', model: CloudToken});
}

blueprint.controller (CloudTokenController, ResourceController);

module.exports = CloudTokenController;

/**
 * Register a token.
 *
 */
CloudTokenController.prototype.create = function () {
  return {
    validate: {
      device: {
        notEmpty: {
          errorMessage: 'Missing device id parameter'
        }
      },

      token: {
        notEmpty: {
          errorMessage: 'Missing token parameter'
        }
      }
    },

    execute: function (req, res, callback) {
      async.waterfall ([
        function (callback) {
          var query = {device: req.body.device};
          var update = {device: req.body.device, owner: req.user._id, token: req.body.token};
          var options = {upsert: true, new: true};

          CloudToken.findOneAndUpdate (query, update, options, callback);
        },

        function (token, callback) {
          if (!token)
            return callback (new HttpError (400, 'Bad request'));

          res.status (200).json (true);
          return callback (null);
        }
      ], callback);
    }
  }
};
