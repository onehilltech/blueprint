var mongoose = require ('mongoose')
  , winston  = require ('winston')
  , util     = require ('util')
  ;

function Database (opts) {
  this._opts = opts;
}

Database.prototype.connect = function (callback) {
  winston.log ('debug', 'database connection: %s', this._opts.connstr);
  winston.log ('debug', 'database options: %s', util.inspect (this._opts.options));

  mongoose.connect (this._opts.connstr, this._opts.options, callback);
};

Database.prototype.disconnect = function (callback) {
  winston.log ('debug', 'disconnecting from database');
  mongoose.connection.disconnect (callback);
};

Database.prototype.registerModel = function (name, schema) {
  if (mongoose.models[name])
    return mongoose.models[name];

  winston.log ('info', 'model registration: %s', name);
  return mongoose.model (name, schema);
}

module.exports = exports = Database;

exports.Schema = mongoose.Schema;
