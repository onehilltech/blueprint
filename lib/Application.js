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
    return callback (new Error ('Application already initialized'), this);

  callback = callback || function (err, app) {};

  async.waterfall ([
    async.constant (this),

    // First, make sure there is a data directory. This is where the application stores
    // all its internal information.
    function (app, callback) {
      var dataPath = Path.resolve (app.appPath, 'data');
      dataPath.createIfNotExists (function (err) { return callback (err, app); });
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
      if (!app._configs.app.modules)
        return callback (null, app);

      async.eachOf (app._configs.app.modules, function (module, name, callback) {
        var modulePath = path.resolve (app.appPath, '../node_modules', module);
        app.addModule (name, modulePath, callback);
      }, function (err) {
        return callback (err, app);
      })
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
Application.prototype.start = function (done) {
  var self = this;

  function finishStart (err) {
    if (err) return done (err);

    self._server.listen (function (err) {
      if (err) return done (err);

      // Emit that the application has started.
      Framework().messaging.emit ('app.start', self);
      return done (null, self);
    });
  }

  // If there is a database, connect to the database. Otherwise, instruct
  // the server to start listening.
  if (!this._db)
    return finishStart (null);

  /**
   * Read all the files in the directory, and seed the database. To be a seed,
   * the file must end with .seed.js.
   *
   * @param db
   * @param dir
   */
  function seedDatabaseFromPath (path, done) {
    winston.log ('debug', 'seed path: ' + path);

    // Load the seeds in the current directory.
    var filter = /(.+)\.seed\.(js|json)$/;
    var seeds = all ({dirname: path, filter:  filter, excludeDirs :  /.*/});

    async.forEachOf (seeds,
      function (seed, collection, callback) {
        self._db.seed (collection, seed, function (err, seed) {
          return callback (err);
        });
      },
      function (err) {
        return done (err);
      });
  }

  this._db.connect (function (err) {
    if (err) return done (err);

    winston.log ('info', 'connected to the database');

    // Load the general purpose seeds and environment specific seeds into
    // the database. Each seed is stored by its respective model name.
    var seedsPath = Path.resolve (self.appPath, 'seeds');
    var seedsEnvPath = Path.resolve (seedsPath.path, Env.name);
    var paths = [];

    if (seedsPath.exists ())
      paths.push (seedsPath.path);

    if (seedsEnvPath.exists ())
      paths.push (seedsEnvPath.path);

    async.each (paths,
      function (path, callback) {
        seedDatabaseFromPath (path, callback);
      },
      finishStart);
  });
};

/**
 * Add an application module to the application. An application module can only
 * be added once. Two application modules are different if they have the same
 * name, not module path. This will ensure we do not have the same module in
 * different location added to the application more than once.
 *
 * @param module
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
      if (app.listenerManager && appModule.listenerManager)
        app.listenerManager.merge (appModule.listenerManager)

      return callback (null, app);
    },

    // Merge the models.

    function (app, callback) {
      if (app.modelManager && appModule.modelManager)
        app.modelManager.merge (appModule.modelManager);

      return callback (null, app);
    },

    // Merge the policies

    function (app, callback) {
      if (app.policyManager && appModule.policyManager)
        app.policyManager.merge (appModule.policyManager)

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

Application.prototype.__defineGetter__ ('is_init', function () {
  return this._is_init;
});

module.exports = exports = Application;
