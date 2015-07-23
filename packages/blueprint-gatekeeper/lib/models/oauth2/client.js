var mongoose = require ('mongoose')
  , uid      = require ('uid-safe')
  , Schema   = mongoose.Schema
  ;

const DEFAULT_SECRET_LENGTH = 128;

var schema = new Schema ({
  name         : {type: String, required: true, trim: true, unique: true },
  email        : {type: String, required: true, trim: true, unique: true },
  secret       : {type: String, required: true },
  redirect_uri : {type: String, required: true, trim: true, unique: true },
  enabled      : {type: Boolean, default: true }
});

schema.statics.registerNewClient = function (name, email, redirect_uri, secretLength, done) {
  if (typeof secretLength === 'function') {
    done = secretLength;
    secretLength = undefined;
  }

  secretLength = secretLength || DEFAULT_SECRET_LENGTH;
  done = done || function (err, client) { };

  var secret = uid.sync (secretLength);
  var client = new this ({
    name : name,
    email : email,
    secret : secret,
    redirect_uri : redirect_uri
  });

  client.save (function (err) {
    return err ? done (err) : done (null, client);
  });
};

schema.statics.upsertClient = function (name, email, redirect_uri, secretLength, done) {
  if (typeof secretLength === 'function') {
    done = secretLength;
    secretLength = undefined;
  }

  secretLength = secretLength || DEFAULT_SECRET_LENGTH;
  done = done || function (err, client) { };

  var secret = uid.sync (secretLength);
  var client = new this ({
    name : name,
    email : email,
    secret : secret,
    redirect_uri : redirect_uri
  });

  var upsertData = client.toObject ();
  delete upsertData._id;

  this.findOneAndUpdate ({name: client.name}, upsertData, {upsert: true, new: true}, done);
};

const COLLECTION_NAME = 'gatekeeper_oauth2_client';
var model = mongoose.model (COLLECTION_NAME, schema);

module.exports = exports = model;
