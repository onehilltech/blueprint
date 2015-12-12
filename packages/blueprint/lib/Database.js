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

  // Connect to the database.
  mongoose.connect (this._opts.connstr, this._opts.options, function (err) {
    if (!err && self._messenger)
      self._messenger.emit ('database.connect', self);

    callback ();
  });

  if (this._opts['gridfs']) {
    var GridFS = require ('gridfs-stream');

    var conn = mongoose.connection;
    GridFS.mongo = mongoose.mongo;

    conn.once ('open', function () {
      winston.log ('debug', 'Initializing GridFS on database connection');
      this._gridFS = GridFS (conn.db);
    });
  }
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

  winston.log ('debug', 'model registration: %s', name);

  var model = mongoose.model (name, schema);
  this._messenger.emit ('database.model', this, model);

  return model;
};

Database.prototype.__defineGetter__ ('Schema', function () {
  return mongoose.Schema;
});

Database.prototype.createWriteStream = function (opts) {
  return this._gridFS.createWriteStream (opts);
};

// Export the database, and the different class types.
module.exports = exports = Database;
exports.Schema = mongoose.Schema;
