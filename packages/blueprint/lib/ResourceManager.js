var extend     = require ('extend')
  , all        = require ('require-all')
  , objectPath = require ('object-path')
  , util       = require ('util')
  ;

function ResourceManager (kind, opts) {
  this._kind = kind;
  this._resources = {};

  this._opts = opts || {};
}

ResourceManager.SCM_DIRECTORIES = /^\.(git|svn)$/;

/**
 * Load the resources. This must be implemeneted by subclasses.
 *
 * @param path        Path to resources
 * @param opts        Options for loading
 */
ResourceManager.prototype.load = function (path, callback) {
  var recursive = this._opts.recursive || true;
  var filter = this._opts.filter || /(.+)\.js$/;
  var excludeDirs = this._opts.excludeDirs || ResourceManager.SCM_DIRECTORIES;
  var resolve = this._opts.resolve;

  try {
    var resources = all ({
      dirname: path,
      filter: filter,
      excludeDirs: excludeDirs,
      recursive: recursive,
      resolve: resolve
    });

    // We are going to extend the existing resources. Any existing resources
    // will be overwritten with what we just loaded.
    this._resources = extend (true, this._resources, resources);

    return callback (null, this);
  } catch (e) {
    return callback (e, this);
  }
};

/**
 * Merge the resources of a source ResourceManager with this manager.
 *
 * @param src
 */
ResourceManager.prototype.merge = function (src) {
  if (this._kind !== src._kind)
    throw new Error (util.format ('Cannot merge resources of different kind [%s != %s]', this._kind, src._kind));

  this._resources = extend (true, this._resources, src._resources);
};

/**
 * Find a resource by name. The name can be a fully qualified object path, such
 * as a.b.c
 *
 * @param path
 */
ResourceManager.prototype.find = function (path) {
  return objectPath.get (this._resources, path);
};

ResourceManager.prototype.__defineGetter__ ('resources', function () {
  return this._resources;
});

module.exports = exports = ResourceManager;
