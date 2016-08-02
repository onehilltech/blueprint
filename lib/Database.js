var mongoose  = require ('mongoose')
  , winston   = require ('winston')
  , util      = require ('util')
  , fs        = require ('fs')
  , async     = require ('async')
  ;

/**
 * @class Database
 *
 * Wrapper class that simplifies working with the database.
 *
 * @param opts
 * @constructor
 */
function Database (opts) {
  this.conn = mongoose.createConnection ();
  this._opts = opts;
}

Database.Schema = mongoose.Schema;

/**
 * Set the messenter for the database.
 *
 * @param messenger
 */
Database.prototype.setMessenger = function (messenger) {
  this._messenger = messenger;
};

/**
 * Connect to the database.
 *
 * @param callback
 */
Database.prototype.connect = function (callback) {
  var self = this;

  // Connect to the database.
  winston.log ('debug', 'connecting to database');

  this.conn.open (this._opts.connstr, this._opts.options, function (err) {
    if (!err && self._messenger)
      self._messenger.emit ('database.connect', self);

    callback (err);
  });
};

/**
 * Disconnect from the database.
 *
 * @param callback
 */
Database.prototype.disconnect = function (callback) {
  var self = this;

  winston.log ('debug', 'disconnecting from database');

  this.conn.close (function (err) {
    if (!err && self._messenger)
      self._messenger.emit ('database.disconnect', self);

    callback (err);
  });
};

/**
 * Register a model with the database.
 *
 * @param name
 * @param schema
 * @returns {*}
 */
Database.prototype.registerModel = function (name, schema) {
  if (this.conn.models[name])
    return this.conn.models[name];

  winston.log ('debug', 'model registration: %s', name);

  var model = this.conn.model (name, schema);

  if (this._messenger)
    this._messenger.emit ('database.model', this, model);

  return model;
};

/**
 * Get the state of the database.
 */
Database.prototype.__defineGetter__ ('state', function () {
  return this.conn._readyState;
});

Database.prototype.__defineGetter__ ('gridfs', function () {
  return this._gridFS;
});

Database.prototype.__defineGetter__ ('models', function () {
  return this.conn.models;
});

Database.prototype.__defineGetter__ ('Schema', function () {
  return Database.Schema;
});

// Export the database, and the different class types.
module.exports = exports = Database;
