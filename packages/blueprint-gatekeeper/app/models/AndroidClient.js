'use strict';

var uid     = require ('uid-safe')
  , mongodb = require ('@onehilltech/blueprint-mongodb')
  , Native  = require ('./Client')
  , options = require ('./commonOptions') ()
  ;

options.discriminatorKey = Native.schema.options.discriminatorKey;

const DEFAULT_SECRET_LENGTH = 128;

var schema = new mongodb.Schema ({
  /// The client secret, which can be auto-generated.
  client_secret: {type: String, required: true, validation: {optional: true}},

  /// Android package.
  package: {type: String, required: true}
}, options);

schema.pre ('validate', function (next) {
  if (!this.client_secret || this.client_secret === '')
    this.client_secret = uid.sync (DEFAULT_SECRET_LENGTH);

  return next ();
});

module.exports = Native.discriminator ('android', schema);
