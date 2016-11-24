'use strict';

const blueprint = require ('@onehilltech/blueprint')
  , path        = require ('path')
  , async       = require ('async')
  ;

var opts = {};

async.each (blueprint.app.server.protocols, function (protocol, callback) {
  opts[protocol.name] = protocol.server;
  return callback (null);
}, complete);

function complete (err) {
  if (err) throw err;

  var libPath = path.resolve (__dirname, '../../lib');
  require (libPath) (opts);
}
