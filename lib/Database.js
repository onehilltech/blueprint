'use strict';

var mongoose  = require ('mongoose')
  , winston   = require ('winston')
  , util      = require ('util')
  ;

function Database (opts) {
  this._opts = opts;
}

Database.prototype.setMessenger = function (messenger) {
  this._messenger = messenger;
};

Database.prototype.connect = function (callback) {
  var self = this;
  winston.log ('debug', 'database connection: %s', this._opts.connstr);
  winston.log ('debug', 'database options: %s', util.inspect (this._opts.options));

  mongoose.connect (this._opts.connstr, this._opts.options, function (err) {
    if (!err && self._messenger)
      self._messenger.emit ('database.connect', self);

    callback ();
  });
};

Database.prototype.disconnect = function (callback) {
  var self = this;
  winston.log ('debug', 'disconnecting from database');

  mongoose.connection.disconnect (function (err) {
    if (!err && self._messenger)
      self._messenger.emit ('database.disconnect', self);

    callback (err);
  });
};

Database.prototype.registerModel = function (name, schema) {
  if (mongoose.models[name])
    return mongoose.models[name];

  winston.log ('info', 'model registration: %s', name);

  var model = mongoose.model (name, schema);
  this._messenger.emit ('database.model', this, model);

  return model;
}

Database.prototype.__defineGetter__ ('Schema', function () {
  return mongoose.Schema;
});

// Export the database, and the different class types.
module.exports = exports = Database;
exports.Schema = mongoose.Schema;
