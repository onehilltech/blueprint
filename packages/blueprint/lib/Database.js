var mongoose = require ('mongoose')
  , winston  = require ('winston')
  , util     = require ('util')
  ;

function Database (opts) {
  this._opts = opts;
}

Database.prototype.connect = function (callback) {
  winston.log ('info', 'connecting to database [connstr=%s]', this._opts.connstr);
  winston.log ('info', 'options = %s', util.inspect (this._opts.options));

  mongoose.connect (this._opts.connstr, this._opts.options, callback);
};

Database.prototype.disconnect = function (callback) {
  mongoose.connection.disconnect (callback);
};
