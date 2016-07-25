var util = require ('util')
  , _ = require ('underscore')
  , ResourceManager = require ('./ResourceManager')
  ;

function PolicyManager (opts) {
  ResourceManager.call (this, 'policies', opts);
}

util.inherits (PolicyManager, ResourceManager);

/**
 * Load policies from the specified path.
 *
 * @param path
 * @param opts
 */
PolicyManager.prototype.load = function (path, opts) {
  opts = _.extend ({recursive: true}, opts);
  ResourceManager.prototype.load.call (this, path, opts);
};

PolicyManager.prototype.__defineGetter__ ('policies', function () {
  return this._resources;
});
