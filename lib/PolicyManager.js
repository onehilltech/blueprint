var all = require ('require-all')
  , objectPath = require ('object-path')
  ;

function PolicyManager () {
  this._policies = {};
}

/**
 * Load policies from the specified path.
 *
 * @param path
 * @param callback
 */
PolicyManager.prototype.load = function (path) {
  this._policies = all ({
    dirname: path,
    filter:  /(.+)\.js$/,
    excludeDirs: /.*/,
    recursive: false
  });
};

PolicyManager.prototype.find = function (name) {
  return objectPath.get (this._policies, name);
};
