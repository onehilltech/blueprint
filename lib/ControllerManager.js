var util = require ('util')
  , _ = require ('underscore')
  ;

var ResourceManager = require ('./ResourceManager')
  ;

function ControllerManager (opts) {
  ResourceManager.call (this, 'controllers', opts);
}

util.inherits (ControllerManager, ResourceManager);

ControllerManager.prototype.load = function (path, opts) {
  function resolve (Controller) {
    return new Controller ();
  }

  opts = _.extend ({
    resolve: resolve,
    filter : /(.+Controller)\.js$/
  }, opts);

  ResourceManager.prototype.load.call (this, path, opts);
};

ControllerManager.prototype.__defineGetter__ ('controllers', function () {
  return this._resources;
});

module.exports = exports = ControllerManager;
