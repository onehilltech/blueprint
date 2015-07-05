var mongoose = require ('mongoose')
  ;

function Database () {

}

Database.prototype.close = function () {
  mongoose.connection.close ();
};

Database.prototype.connect = function (connstr, options, done) {
  mongoose.connect (connstr, options, done);
}

var db = new Database ();
exports = module.exports = db;
