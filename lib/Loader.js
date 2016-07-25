'use strict';

var winston = require ('winston')
  , path    = require ('path')
  , all     = require ('require-all')
  , fs      = require ('fs')
  , async   = require ('async')
  ;

var RouterBuilder = require ('./RouterBuilder')
  , Messaging     = require ('./Messaging')
  ;

var SCM_DIRECTORIES = /^\.(git|svn)$/;
var ROUTER_SUFFIX = 'Router.js';

// The solution for endWith() is adopted from the following solution on
// StackOverflow:
//
//  http://stackoverflow.com/a/2548133/2245732

if (typeof String.prototype.endsWith !== 'function') {
  String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };
}

/**
 * Load the routers in the specified path.
 *
 * @param path
 * @param controllers
 */
exports.loadRouters = function (routerPath, controllers) {
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

        winston.log ('debug', 'processing router %s', routerName);
        var routerSpec = require (filename);

        var builder = new RouterBuilder (controllers, basePath);
        builder.addSpecification (routerSpec);

        routers[routerName] = builder.getRouter ();
      }
    });

    return routers;
  }

  return processDirectory (routerPath, '', controllers);
};
