var util            = require ('util')
  , _               = require ('underscore')
  , path            = require ('path')
  , fs              = require ('fs')
  , ResourceManager = require ('./ResourceManager')
  , RouterBuilder   = require ('./RouterBuilder')
  ;

const ROUTER_SUFFIX = 'Router.js';

// The solution for endWith() is adopted from the following solution on
// StackOverflow:
//
//  http://stackoverflow.com/a/2548133/2245732

if (typeof String.prototype.endsWith !== 'function') {
  String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };
}

function RouterManager (controllers, opts) {
  ResourceManager.call (this, 'routers', opts);
  this._controllers = controllers;
}

util.inherits (RouterManager, ResourceManager);

RouterManager.prototype.load = function (loadPath, opts) {
  var self = this;

  function processDirectory (currPath, basePath) {
    // Read the names of the files in the current path.
    var routers = {};
    var names = fs.readdirSync (currPath);

    names.forEach (function (name) {
      // Compute the full path of the filename, and get information about it.
      var filename = path.resolve (currPath, name);
      var stat = fs.statSync (filename);

      if (stat.isDirectory ()) {
        // Process this subdirectory.
        var nextBasePath = basePath + '/' + name;
        routers[name] = processDirectory (filename, nextBasePath);
      }
      else if (name.endsWith (ROUTER_SUFFIX)) {
        // Make sure this is a router file.
        var routerName = name.slice (0, name.length - ROUTER_SUFFIX.length);
        var routerSpec = require (filename);

        var builder = new RouterBuilder (self._controllers, basePath);
        builder.addSpecification (routerSpec);

        routers[routerName] = builder.getRouter ();
      }
    });

    return routers;
  }

  this._resources = processDirectory (loadPath, '', this._controllers);
};

RouterManager.prototype.__defineGetter__ ('routers', function () {
  return this._resources;
});

module.exports = exports = RouterManager;