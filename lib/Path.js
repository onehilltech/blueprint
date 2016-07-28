var fs   = require ('fs')
  , path = require ('path')
  ;

function Path (path) {
  this.path = path;
}

Path.resolve = function () {
  var target = path.resolve;
  var result = target.apply (null, arguments);
  return new Path (result);
};

Path.prototype.createIfNotExists = function (callback) {
  var self = this;

  fs.stat (this.path, function (err, stats) {
    if (err) return fs.mkdir (self.path, callback);
    if (!stats.isDirectory ()) return callback (new Error ('Path is not a directory'));
    return callback (null);
  });
};

Path.prototype.exists = function (callback) {
  fs.stat (this.path, function (err, stats) {
    if (err) return callback (err);
    return callback (null, stats);
  });
};

module.exports = exports = Path;
