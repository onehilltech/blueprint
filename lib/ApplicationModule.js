var winston = require ('winston')
  , path    = require ('path')
  , all     = require ('require-all')
  , fs      = require ('fs')
  , async   = require ('async')
  ;

var RouterBuilder = require ('./RouterBuilder')
  , Database      = require ('./Database')
  , Messaging     = require ('./Messaging')
  ;

// Use the default messenger for the application module.
var messenger = Messaging.Messenger ();

/**
 * @class ApplicationModule
 *
 * Application that is loaded via the node_modules.
 *
 * @param appPath
 * @constructor
 */
function ApplicationModule (appPath) {
  // Initialize the application module.
  this._appPath = path.resolve (appPath);

  this._listeners = undefined;
  this._controllers = undefined;
  this._models = undefined;
  this._routers = undefined;
}

/**
 * Get the models defined by the application.
 */
ApplicationModule.prototype.__defineGetter__ ('models', function () {
  if (this._models)
    return this._models;

  // Load all the models into memory.
  winston.log ('debug', 'loading application models into memory');
  messenger.emit ('appmodule.models.loading', this);

  this._models = all({
    dirname: path.join (this._appPath, 'models'),
    filter: /(.+)\.js$/,
    excludeDirs: /^\.(git|svn)$/
  });

  messenger.emit ('appmodule.models.loaded', this);
  return this._models;
});

/**
 * Get the controllers defined by the application.
 */
ApplicationModule.prototype.__defineGetter__ ('controllers', function () {
  if (this._controllers)
    return this._controllers;

  // Load all the controllers into memory.
  winston.log ('debug', 'loading application controllers into memory');
  messenger.emit ('appmodule.controllers.loading', this);

  this._controllers = all ({
    dirname     :  path.join (this._appPath, 'controllers'),
    filter      :  /(.+Controller)\.js$/,
    excludeDirs :  /^\.(git|svn)$/,
    resolve     : function (Controller) {
      winston.log ('debug', 'instantiating controller %s', Controller.name);
      return new Controller ();
    }
  });

  messenger.emit ('appmodule.controllers.loaded', this);
  return this._controllers;
});

/**
 * Get the controllers defined by the application.
 */
ApplicationModule.prototype.__defineGetter__ ('routers', function () {
  if (this._routers)
    return this._routers;

  // Load all the routers into memory.
  winston.log ('debug', 'loading application routers into memory');
  messenger.emit ('appmodule.routers.loading', this);

  var routerPath = path.join (this._appPath, 'routers');
  var self = this;

  this._routers = all ({
    dirname     :  routerPath,
    filter      :  /(.+Router)\.js$/,
    excludeDirs :  /^\.(git|svn)$/,
    resolve     : function (routes) {
      var builder = new RouterBuilder (routerPath, self.controllers);
      var router =  builder.addRoutes (routes).getRouter ();

      return router;
    }
  });

  messenger.emit ('appmodule.routers.loaded', this);
  return this._routers;
});

/**
 * Get the listener for the application. If the listeners are not loaded, then load
 * the listeners in the application directory.
 */
ApplicationModule.prototype.__defineGetter__ ('listeners', function () {
  if (this._listeners)
    return this._listeners;

  this._listeners = {};

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
        messenger.on (eventName, listener);
        return listener;
      }
    });

    return listeners;
  }

  // Determine if the application has defined any listeners. If this is the
  // case, then load all the listeners and register them.
  try {
    var self = this;
    var listenersPath = path.join (this._appPath, 'listeners');
    var stats = fs.lstatSync (listenersPath);

    if (stats.isDirectory ()) {
      // Each directory in the listener path is the name of the event we are
      // listening for. Each file in the event directory is a listener to be
      // registered with the messaging service.
      var files = fs.readdirSync (listenersPath);

      async.eachSeries (files, function (file, callback) {
        // Determine if the current file is a directory. If the path is a directory,
        // then we are processing an event name.
        var eventPath = path.join (listenersPath, file);
        stats = fs.lstatSync (eventPath);

        if (stats.isDirectory ())
          self._listeners[file] = registerListeners (file, eventPath);

        callback ();
      });
    }
    else {
      throw new Error ('The listeners application path is not a directory');
    }
  }
  catch (e) {
    // Do nothing...
  }
});

/**
 * Get the current Node.js environment. The default Node.js environment is development.
 */
ApplicationModule.prototype.__defineGetter__ ('env', function () {
  return process.env.NODE_ENV || 'dev';
});

ApplicationModule.prototype.__defineGetter__ ('Schema', function () {
  return Database.Schema;
});

/**
 * Read an application resource. If the callback is undefined, then the data in the
 * resource is returned to the caller.
 * 
 * @param filename
 * @param callback
 * @returns {*}
 */
ApplicationModule.prototype.resource = function (filename, callback) {
  var fullpath = path.resolve (this._appPath, 'resources', filename);

  if (callback)
    return fs.readFile (fullpath, callback);
  else
    return fs.readFileSync (fullpath);
};

module.exports = exports = ApplicationModule;

