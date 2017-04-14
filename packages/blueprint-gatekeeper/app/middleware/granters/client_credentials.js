'use strict';

const blueprint = require ('@onehilltech/blueprint')
  , ClientToken = require ('../../models/ClientToken')
  ;

var exports = module.exports = {};

exports.createToken = function (opts, callback) {
  var doc = {client: opts.client._id, scope: opts.client.scope};
  ClientToken.create (doc, callback);
};
