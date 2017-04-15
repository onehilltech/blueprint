'use strict';

var uid     = require ('uid-safe')
  , mongodb = require ('@onehilltech/blueprint-mongodb')
  , Native  = require ('./NativeClient')
  , options = require ('./commonOptions') ()
  ;

options.discriminatorKey = Client.schema.options.discriminatorKey;

var schema = new mongodb.Schema ({
  package: {type: String, required: true}
}, options);

module.exports = Native.discriminator ('android', schema);
