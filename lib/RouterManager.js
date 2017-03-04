var util            = require ('util')
  , extend          = require ('extend')
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

function RouterManager (app, opts) {
  ResourceManager.call (this, 'routers', opts);
  this._app = app;
}

util.inherits (RouterManager, ResourceManager);

RouterManager.prototype.load = function (loadPath, callback) {
  var _this = this;

  function processDirectory (currPath, basePath, callback) {
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

              processDirectory (filename, nextBasePath, function (err, result) {
                routers[name] = result;
                return callback (null);
              });
            }
            else if (name.endsWith (ROUTER_SUFFIX)) {
              // Make sure this is a router file.
              var routerName = name.slice (0, name.length - ROUTER_SUFFIX.length);
              var routerSpec = require (filename);

              var builder = new RouterBuilder (_this._app, basePath);
              builder.addSpecification (routerSpec);

              // Insert the specification into the router.
              var router = builder.getRouter ();
              router.spec = routerSpec;

              // Add the router to our list of routers.
              routers[routerName] = router;

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

  processDirectory (loadPath, '', function (err, result) {
    if (err) return callback (err);

    self._resources = extend (true, self._resources, result);

    return callback (null, self);
  });
};

RouterManager.prototype.__defineGetter__ ('routers', function () {
  return this._resources;
});

module.exports = exports = RouterManager;