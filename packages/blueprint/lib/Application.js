var winston = require ('winston')
  , path    = require ('path')
  , util    = require ('util')
  , fs      = require ('fs')
  , all     = require ('require-all')
  , async   = require ('async')
  ;

var Server            = require ('./Server')
  , RouterBuilder     = require ('./RouterBuilder')
  , Configuration     = require ('./Configuration')
  , Database          = require ('./Database')
  , ApplicationModule = require ('./ApplicationModule')
  , Framework         = require ('./Framework')
  , Path              = require ('./Path')
  , Env               = require ('./Environment')
  ;

/**
 * @class Application
 *
 * The main Blueprint.js application.
 *
 * @param appPath
 * @constructor
 */
function Application (appPath) {
  // Initialize the base class.
  ApplicationModule.call (this, appPath);

  // Load the application configuration.
  var appConfigPath = path.join (appPath, 'configs', 'app.config.js');
  var appConfig = require (appConfigPath);
  this.name = appConfig.name;
  this._modules = {};
}

util.inherits (Application, ApplicationModule);

/**
 * Initialize the application.
 */
Application.prototype.init = function (callback) {
  if (this._is_init)
    return callback (null, this);

  callback = callback || function (err, app) {};

  async.waterfall ([
    async.constant (this),

    // First, make sure there is a data directory. This is where the application stores
    // all its internal information.
    function (app, callback) {
      var tempPath = Path.resolve (app.appPath, 'temp');
      tempPath.createIfNotExists (function (err) { return callback (err, app); });
    },

    // Load all configurations first. This is because other entities in the
    // application may need the configuration object for initialization.
    function (app, callback) {
      var configPath = path.join (app.appPath, 'configs');

      Configuration (configPath, Env.name, function (err, configs) {
        if (err) return callback (err);
        app._configs = configs;

        return callback (null, app);
      });
    },

    function (app, callback) {
      // Store the configurations in the application.
      if (!app._configs.database) return callback (null, app);

      winston.log ('info', 'application has database support');

      app._db = new Database (app._configs.database);
      app._db.setMessenger (Framework ().messaging);

      return callback (null, app);
    },

    // Make the server object for the application.
    function (app, callback) {
      var server = new Server (app.appPath);

      server.configure (app._configs.server, function (err, server) {
        if (err) return callback (err);
        app._server = server;

        return callback (null, app);
      });
    },

    // Load the modules for the application.
    function (app, callback) {
      if (!app._configs.app['modules'])
        return callback (null, app);

      var resolver = {
        path: function (location) {
          return path.resolve (app.appPath, location, 'app');
        },
        module: function (location) {
          return path.resolve (app.appPath, '../node_modules', location, 'app')
        }
      };

      async.eachOf (app._configs.app['modules'], function (value, name, callback) {
        var parts = value.split ('://');
        var protocol = parts[0];
        var location = resolver[protocol](parts[1]);

        app.addModule (name, location, callback);
      }, function (err) {
        return callback (err, app);
      });
    },

    // Let's configure the application module portion of the application.
    function (app, callback) {
      ApplicationModule.prototype.init.call (app, callback);
    },

    // Move the views to the correct location.
    function (app, callback) {
      if (!app.getSupportsViews ())
        return callback (null, app);

      var viewsPath = app.getViewsPath ();
      app._server.importViews (viewsPath, function (err) {
        return callback (err, app);
      });
    },

    // Make the router for the application. Then, install the router in the
    // server object. Part of loading the routers requires force loading of
    // the controllers. Otherwise, the router builder will not be able to
    // resolve any of the defined actions.
    function (app, callback) {
      var routersPath = path.resolve (app.appPath, 'routers');
      var builder = new RouterBuilder (app.controllers, routersPath);
      var routers = app.routers;

      app._router =
        builder
          .addRouters (routers)
          .getRouter ();

      app._server.setMainRouter (app._router);

      return callback (null, app);
    }
  ], function (err, app) {
    if (err) return callback (err);

    // Notify all listeners the application is initialized.
    Framework ().messaging.emit ('app.init', app);
    app._is_init = true;

    return callback (null, app);
  });
};

/**
 * Start the application. This method connects to the database, creates a
 * new server, and starts listening for incoming messages.
 *
 * @param done
 */
Application.prototype.start = function (callback) {
  async.waterfall ([
    async.constant (this),

    // Connect to the database.
    function (app, callback) {
      if (!app._db) return callback (null, app);

      app._db.connect (function (err) {
        return callback (err, app);
      });
    },

    // Listen for events.
    function (app, callback) {
      app._server.listen (function (err) {
        return callback (err, app);
      });
    }
  ], function (err, app) {
    if (err) return callback (err);

    Framework ().messaging.emit ('app.start', app);

    return callback (null, app);
  });
};

/**
 * Add an application module to the application. An application module can only
 * be added once. Two application modules are different if they have the same
 * name, not module path. This will ensure we do not have the same module in
 * different location added to the application more than once.
 *
 * @param name
 * @param path
 * @param callback
 */
Application.prototype.addModule = function (name, path, callback) {
  if (this._modules.hasOwnProperty (name))
    throw new Error (util.format ('duplicate module: %s', name));

  var appModule = new ApplicationModule (path);

  async.waterfall ([
    async.constant (this),

    function (app, callback) {
      appModule.init (function (err, module) {
        if (err) return callback (err);

        // Store the module
        app._modules[name] = module;

        return callback (null, app);
      });
    },

    // Import the views from the module into the application.

    function (app, callback) {
      if (!app._server && appModule.getSupportsViews ())
        return callback (null, app);

      app._server.importViews (appModule.getViewsPath (), function (err) {
        return callback (err, app);
      });
    },

    // Merge the listeners

    function (app, callback) {
      app.listenerManager.merge (appModule.listenerManager);
      return callback (null, app);
    },

    // Merge the models.

    function (app, callback) {
      app.modelManager.merge (appModule.modelManager);
      return callback (null, app);
    },

    // Merge the policies

    function (app, callback) {
      app.policyManager.merge (appModule.policyManager);
      return callback (null, app);
    }
  ], callback);
};

/**
 * Get the application database.
 */
Application.prototype.__defineGetter__ ('database', function () {
  if (!this._db)
    throw new Error ('application did not configure database');

  return this._db;
});

/**
 * Get the application database.
 */
Application.prototype.__defineGetter__ ('configs', function () {
  return this._configs;
});

/**
 * Get the application server.
 */
Application.prototype.__defineGetter__ ('server', function () {
  if (!this._server)
    throw new Error ('application did not configure server');

  return this._server;
});

/**
 * Get the Blueprint modules loaded by the application.
 */
Application.prototype.__defineGetter__ ('modules', function () {
  return this._modules;
});

/**
 * Test if the application is initialized.
 */
Application.prototype.__defineGetter__ ('is_init', function () {
  return this._is_init;
});

/**
 * Read an application resource. If a callback is provided, then it reads the
 * resource asynchronously. If a callback is not provided, then the resource is
 * read synchronously.
 *
 * @param path          Path to resource
 * @param opts          Options for reading
 * @param callback      Optional callback
 */
Application.prototype.resource = function (location, opts, callback) {
  var fullPath = path.resolve (this.appPath, 'resources', location);

  if (callback)
    return fs.readfile (fullPath, opts, callback);
  else
    return fs.readFileSync (fullPath, opts);
};

module.exports = exports = Application;
