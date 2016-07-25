var util = require ('util')
  ;

var ResourceManager = require ('./ResourceManager')
  ;

function ModelManager (opts) {
  ResourceManager.call (this, 'models', opts);
}

util.inherits (ModelManager, ResourceManager);

ModelManager.prototype.__defineGetter__ ('models', function () {
  return this._resources;
});

module.exports = exports = ModelManager;
