'use strict';

const async     = require ('async')
  , blueprint   = require ('@onehilltech/blueprint')
  , HttpError   = blueprint.errors.HttpError
  , ClientToken = require ('../../models/ClientToken')
  ;

var exports = module.exports = {};

exports.policies = function (req, callback) {
  var clientSecret = req.body.client_secret;

  if (clientSecret && req.client.secret !== clientSecret)
    return callback (new HttpError (400, 'incorrect_secret', 'Client secret is incorrect'));

  return callback (null, true);
};

exports.createToken = function (req, callback) {
  var doc = {client: req.client._id, scope: req.client.scope};
  ClientToken.create (doc, callback);
};
