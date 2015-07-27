var mongoose = require ('mongoose')
  , config   = require ('../../config').get ()
  ;

exports.connect = function (done) {
  mongoose.connect (config.connstr, config.mongodb, done);
};

exports.disconnect = function (done) {
  mongoose.disconnect (done);
};

exports.debug = function (state) {
  mongoose.set ('debug', state);
};