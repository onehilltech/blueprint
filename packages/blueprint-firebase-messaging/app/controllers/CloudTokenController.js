'use strict';

let blueprint  = require ('@onehilltech/blueprint')
  , mongodb    = require ('@onehilltech/blueprint-mongodb')
  , async      = require ('async')
  , CloudToken = require ('../models/CloudToken')
  , jwt        = require ('jsonwebtoken')
  , ResourceController = mongodb.ResourceController
  ;

let claimTicketOptions = null;

blueprint.messaging.on ('app.init', function (app) {
  claimTicketOptions = app.configs['cloud-messaging'].claimTicketOptions;
});

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
          let ret = {};

          if (!token.owner) {
            let options = {jwtid: token.id, issuer: 'cloud-messaging', audience: 'user', subject: 'claim-ticket'};
            let cert = claimTicketOptions.secret || claimTicketOptions.privateKey;

            let claimTicket = jwt.sign ({device: token.device}, cert, options);
            ret.claim_ticket = {claim_ticket: claimTicket};
          }

          res.status (200).json (ret);

          return callback (null);
        }
      ], callback);
    },
  }
};

CloudTokenController.prototype.claimDevice = function () {
  return {
    validate: {
      claim_ticket: {
        notEmpty: { errorMessage: 'You must provide a claim ticket.' }
      }
    },

    execute (req, res, callback) {
      async.waterfall ([
        function (callback) {
          let claimTicket = req.body.claim_ticket;
          let options = {issuer: 'cloud-messaging', audience: 'user', subject: 'claim-ticket'};
          let cert = claimTicketOptions.secret || claimTicketOptions.publicKey;

          jwt.verify (claimTicket, cert, options, callback);
        },

        function (payload, callback) {
          let update = {owner: req.user._id};
          CloudToken.findByIdAndUpdate (payload.jti, update, callback);
        },

        function (token, callback) {
          res.status (200).json (!!token);
          return callback (null);
        }
      ], callback);
    }
  };
};
