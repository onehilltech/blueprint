var mongoose  = require ('mongoose')
  , mongo     = require ('mongodb')
  , winston   = require ('winston')
  , util      = require ('util')
  , fs        = require ('fs')
  , GridFS    = require ('./GridFS')
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

  // Connect to the database.
  mongoose.connect (this._opts.connstr, this._opts.options, function (err) {
    if (!err && self._messenger)
      self._messenger.emit ('database.connect', self);

    callback ();
  });

  // Initialize GridFS support for the database.
  this._gridFS = new GridFS (mongoose.connection);
};

Database.prototype.disconnect = function (callback) {
  var self = this;
  winston.log ('debug', 'disconnecting from database');

  mongoose.connection.disconnect (function (err) {
    // Delete our instance of GridFS.
    delete self._gridFS;

    if (!err && self._messenger)
      self._messenger.emit ('database.disconnect', self);

    callback (err);
  });
};

Database.prototype.registerModel = function (name, schema) {
  if (mongoose.models[name])
    return mongoose.models[name];

  winston.log ('debug', 'model registration: %s', name);

  var model = mongoose.model (name, schema);
  this._messenger.emit ('database.model', this, model);

  return model;
};

Database.prototype.__defineGetter__ ('Schema', function () {
  return mongoose.Schema;
});

Database.prototype.__defineGetter__ ('gridfs', function () {
  return this._gridFS;
});

/**
 * Create a GridFS write stream to the database.
 *
 * @param file
 * @param metadata
 * @returns {Stream}
 */
Database.prototype.createWriteStream = function (opts) {
  return this._gridFS.createWriteStream (opts);
};


// Export the database, and the different class types.
module.exports = exports = Database;
exports.Schema = mongoose.Schema;
