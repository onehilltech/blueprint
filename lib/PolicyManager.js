var util = require ('util')
  , _ = require ('underscore')
  , ResourceManager = require ('./ResourceManager')
  ;

function PolicyManager (opts) {
  ResourceManager.call (this, 'policies', opts);
}

util.inherits (PolicyManager, ResourceManager);

PolicyManager.prototype.__defineGetter__ ('policies', function () {
  return this._resources;
});

module.exports = exports = PolicyManager;
