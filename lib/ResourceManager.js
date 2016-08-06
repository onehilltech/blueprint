var extend = require ('extend')
  , all = require ('require-all')
  , objectPath = require ('object-path')
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
ResourceManager.prototype.load = function (path, opts, callback) {
  if (!callback) {
    callback = opts;
    opts = {};
  }

  opts = opts || {};
  var recursive = opts.recursive || true;
  var filter = opts.filter || /(.+)\.js$/;
  var excludeDirs = opts.excludeDirs || ResourceManager.SCM_DIRECTORIES;
  var resolve = opts.resolve;

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
 * @param mgr
 */
ResourceManager.prototype.merge = function (mgr) {
  if (this._kind !== mgr._kind)
    throw new Error ('Cannot merge resources of different kind');

  this._resources = extend (true, this._resources, mgr._resources);
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
