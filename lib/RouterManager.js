'use strict';

const util = require ('util')
  , extend = require ('extend')
  , path   = require ('path')
  , fs     = require ('fs')
  , async  = require ('async')
  , debug  = require ('debug') ('blueprint:router-manager')
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

module.exports = RouterManager;

/**
 * Load the routers.
 */
RouterManager.prototype.load = function (srcPath, callback) {
  debug ('loading routers in ' + srcPath);

  async.waterfall ([
    /*
     * Start processing directory at the source path.
     */
    function (callback) {
      this._processDirectory (srcPath, '', callback);
    }.bind (this),

    /*
     * Extend our resources with the results.
     */
    function (result, callback) {
      this._resources = extend (true, this._resources, result);
      return callback (null, this);
    }.bind (this)
  ], callback);
};

RouterManager.prototype.__defineGetter__ ('routers', function () {
  return this._resources;
});

RouterManager.prototype._processDirectory = function (currPath, basePath, callback) {
  debug ('processing ' + currPath);
  debug ('base path: ' + basePath);

  // Read the names of the files in the current path.
  var routers = {};

  function complete (err) {
    return callback (err, routers);
  }

  async.waterfall ([
    function (callback) {
      fs.readdir (currPath, callback);
    },

    function (names, callback) {
      async.each (names, function (name, callback) {
        const filename = path.resolve (currPath, name);

        if (name.endsWith (ROUTER_SUFFIX)) {
          debug ('building router ' + name);

          // Make sure this is a router file.
          var routerName = name.slice (0, name.length - ROUTER_SUFFIX.length);
          var routerSpec = require (filename);

          var builder = new RouterBuilder (this._app, basePath);
          builder.addSpecification (routerSpec);

          // Insert the specification into the  router.
          var router = builder.getRouter ();
          router.spec = routerSpec;

          // Add the router to our list of routers.
          routers[routerName] = router;

          return callback (null);
        }
        else {
          async.waterfall ([
            /*
             * Get the stats for the current file.
             */
            function (callback) {
              fs.stat (filename, callback);
            },

            /*
             * Process the path.
             */
            function (stats, callback) {
              if (!stats.isDirectory ())
                return callback (null);

              const nextBasePath = basePath + '/' + name;

              async.waterfall ([
                function (callback) {
                  this._processDirectory (filename, nextBasePath, callback);
                }.bind (this),

                function (result, callback) {
                  debug ('done processing ' + filename);
                  routers[name] = result;

                  return callback (null);
                }
              ], callback);
            }.bind (this)
          ], callback);
        }
      }.bind (this), callback);
    }.bind (this)
  ], complete)
};
