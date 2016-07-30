var util            = require ('util')
  , _               = require ('underscore')
  , path            = require ('path')
  , fs              = require ('fs')
  , async           = require ('async')
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

function RouterManager (opts) {
  ResourceManager.call (this, 'routers', opts);
}

util.inherits (RouterManager, ResourceManager);

RouterManager.prototype.load = function (loadPath, controllers, opts, callback) {
  if (!callback) {
    callback = opts;
    opts = undefined;
  }

  opts = opts || {};

  function processDirectory (currPath, basePath, controllers, callback) {
    // Read the names of the files in the current path.
    var routers = {};

    async.waterfall ([
      function (callback) { fs.readdir (currPath, callback); },

      function (names, callback) {
        async.each (names, function (name, callback) {
          // Compute the full path of the filename, and get information about it.
          var filename = path.resolve (currPath, name);

          fs.stat (filename, function (err, stats) {
            if (err) return callback (err);

            if (stats.isDirectory ()) {
              // Process this subdirectory.
              var nextBasePath = basePath + '/' + name;

              processDirectory (filename, nextBasePath, controllers, function (err, result) {
                routers[name] = result;
                return callback (null);
              });
            }
            else if (name.endsWith (ROUTER_SUFFIX)) {
              // Make sure this is a router file.
              var routerName = name.slice (0, name.length - ROUTER_SUFFIX.length);
              var routerSpec = require (filename);

              var builder = new RouterBuilder (controllers, basePath);
              builder.addSpecification (routerSpec);

              routers[routerName] = builder.getRouter ();

              return callback (null);
            }
            else {
              return callback (null);
            }
          });
        }, function (err) {
          return callback (err, routers);
        });
      }
    ], function (err) {
      return callback (err, routers);
    })
  }

  var self = this;

  processDirectory (loadPath, '', controllers, function (err, result) {
    if (err) return callback (err);

    self._resources = _.extend (self._resources, result);

    return callback (null, self);
  });
};

RouterManager.prototype.__defineGetter__ ('routers', function () {
  return this._resources;
});

module.exports = exports = RouterManager;