'use strict';

var uid     = require ('uid-safe')
  , mongodb = require ('@onehilltech/blueprint-mongodb')
  , Client  = require ('./Client')
  , options = require ('./commonOptions') ()
  ;

options.discriminatorKey = Client.schema.options.discriminatorKey;

var schema = new mongodb.Schema ({
  /// g-recaptcha secret key
  recaptcha_secret: {type: String, required: true}
}, options);

module.exports = Client.discriminator ('recaptcha', schema);
