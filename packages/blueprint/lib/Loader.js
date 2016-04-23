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

const SCM_DIRECTORIES = /^\.(git|svn)$/;
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

/**
 * Load the controllers in the specified path.
 *
 * @param path
 * @returns {{}}
 */
exports.loadControllers = function (path) {
  var controllers = all ({
    dirname     :  path,
    filter      :  /(.+Controller)\.js$/,
    excludeDirs :  SCM_DIRECTORIES,
    resolve     : function (Controller) {
      winston.log ('debug', 'instantiating controller %s', Controller.name);
      return new Controller ();
    }
  });

  return controllers;
};

/**
 * Load the listeners at the specified staff.
 *
 * @param path
 */
exports.loadListeners = function (listenerPath, messaging) {
  var listeners = {};

  /**
   * Helper method that registers listeners within a specific path for the
   * provided event.
   *
   * @param eventName
   * @param eventPath
   */
  function registerListeners (eventName, eventPath) {
    // Load all the JavaScript files in the event path. We do not go into the
    // subdirectories within the event path. For each resolved file, we register
    // the listener for the specified event.
    return all({
      dirname : eventPath,
      filter : /(.+)\.js$/,
      excludeDirs : /.*/,
      resolve : function (listener) {
        var key = listener.targetMessenger;
        var messenger = messaging.getMessenger (key);

        messenger.on (eventName, listener);

        return listener;
      }
    });
  }

  // Determine if the application has defined any listeners. If this is the
  // case, then load all the listeners and register them.
  try {
    var stats = fs.lstatSync (listenerPath);

    if (stats.isDirectory ()) {
      // Each directory in the listener path is the name of the event we are
      // listening for. Each file in the event directory is a listener to be
      // registered with the messaging service.
      var files = fs.readdirSync (listenerPath);

      files.forEach (function (file) {
        // Determine if the current file is a directory. If the path is a directory,
        // then we are processing an event name.
        var eventPath = path.join (listenerPath, file);
        stats = fs.lstatSync (eventPath);

        if (stats.isDirectory ())
          listeners[file] = registerListeners (file, eventPath);
      });
    }
    else {
      throw new Error ('The listeners application path is not a directory');
    }
  }
  catch (e) {
    // Do nothing...
  }

  return listeners;
};

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

/**
 * Load the models in the specified path.
 *
 * @param path
 */
exports.loadModels = function (path) {
  return all({
    dirname: path,
    filter: /(.+)\.js$/,
    excludeDirs: SCM_DIRECTORIES
  });
};