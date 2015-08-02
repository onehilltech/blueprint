var mongoose = require ('mongoose')
  , winston  = require ('winston')
  , util     = require ('util')
  ;

function Database (opts) {
  this._opts = opts;
}

Database.prototype.connect = function (callback) {
  winston.log ('info', 'database connection: %s', this._opts.connstr);
  winston.log ('debug', 'database options: %s', util.inspect (this._opts.options));

  mongoose.connect (this._opts.connstr, this._opts.options, callback);
};

Database.prototype.disconnect = function (callback) {
  mongoose.connection.disconnect (callback);
};

module.exports = exports = Database;
