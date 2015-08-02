var mongoose = require ('mongoose')
  , winston  = require ('winston')
  ;

function Database (opts) {
  this._opts = opts;
}

Database.prototype.connect = function (callback) {
  winston.log ('info', 'connecting to database [connstr=%s]', this._opts.connstr);
  mongoose.connect (this._opts.connstr, this._opts.options, callback);
};

Database.prototype.disconnect = function (callback) {
  mongoose.connection.disconnect (callback);
};
