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

Path.prototype.createIfNotExists = function () {
  try {
    var stat = fs.statSync (this.path);

    if (!stat.isDirectory ())
      throw new Error ('%s is not a directory', this.path);
  }
  catch (ex) {
    fs.mkdirSync (this.path);
  }
};

module.exports = exports = Path;
