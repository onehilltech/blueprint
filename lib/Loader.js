'use strict';

var winston = require ('winston')
  , path    = require ('path')
  , all     = require ('require-all')
  , fs      = require ('fs')
  ;


var RouterBuilder = require ('./RouterBuilder')
  , Messaging     = require ('./Messaging')
  ;

/**
 * Load the controllers in the specified path.
 *
 * @param path
 * @returns {{}}
 */
exports.loadControllers = function (path) {
  var controllers = {};

  controllers = all ({
    dirname     :  path,
    filter      :  /(.+Controller)\.js$/,
    excludeDirs :  /^\.(git|svn)$/,
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
    var listeners = all({
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

    return listeners;
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
 */
exports.loadRouters = function (path, controllers) {
  var routers = all ({
    dirname     :  path,
    filter      :  /(.+Router)\.js$/,
    excludeDirs :  /^\.(git|svn)$/,
    resolve     : function (routes) {
      var builder = new RouterBuilder (path, controllers);
      var router =  builder.addRoutes (routes).getRouter ();

      return router;
    }
  });

  return routers;
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
    excludeDirs: /^\.(git|svn)$/
  });
};