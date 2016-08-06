var util = require ('util')
  , extend = require ('extend')
  ;

var ResourceManager = require ('./ResourceManager')
  ;

function ControllerManager (opts) {
  ResourceManager.call (this, 'controllers', opts);
}

util.inherits (ControllerManager, ResourceManager);

ControllerManager.prototype.load = function (path, opts, callback) {
  if (!callback) {
    callback = opts;
    opts = {};
  }

  function resolve (Controller) {
    return new Controller ();
  }

  opts = extend ({
    resolve: resolve,
    filter : /(.+Controller)\.js$/
  }, opts);

  ResourceManager.prototype.load.call (this, path, opts, callback);
};

ControllerManager.prototype.__defineGetter__ ('controllers', function () {
  return this._resources;
});

module.exports = exports = ControllerManager;
