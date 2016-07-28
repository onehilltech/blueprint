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
  // Load the application configuration.
  var appConfigPath = path.join (appPath, 'configs', 'app.config.js');
  var appConfig = require (appConfigPath);
  this.name = appConfig.name;

  // Initialize the base class.
  ApplicationModule.call (this, this.name, appPath);

  this._is_init = false;
  this._modules = {};
}

util.inherits (Application, ApplicationModule);

/**
 * Initialize the application.
 */
Application.prototype.init = function (callback) {
  if (this._is_init === true)
    return callback (new Error ('Application already initialized'), this);

  callback = callback || function (err, app) {};

  winston.log ('info', 'application path: %s', this.appPath);

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

      // Force loading of the models since we have a database.
      winston.log ('info', 'loading models into memory');
      app.models;

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

    // Move the views to the correct location.
    function (app, callback) {
      async.series ([
        function (callback) {
          if (!app.getSupportsViews ())
            return callback (null);

          var viewsPath = app.getViewsPath ();
          app._server.importViews (viewsPath, callback);
        },
        function (callback) {
          async.eachOfSeries (app._modules, function (module, name, callback) {
            if (module.getSupportsViews ())
              return app._server.importViews (module.getViewsPath (), callback);

            return callback (null);
          }, callback);
        }
      ], function (err) {
        return callback (err, app);
      });
    },

    // Load the policies.
    function (app, callback) {
      var policiesPath = Path.resolve (app.appPath, 'policies');
      policiesPath.exists (function (err, result) {
        if (err) return callback (null, app);
        if (result) app.policies;

        return callback (null, app);
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
Application.prototype.__defineGetter__ ('config', function () {
  return this._config;
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

/**
 * Add an application module to the application. An application module can only
 * be added once. Two application modules are different if they have the same
 * name, not module path. This will ensure we do not have the same module in
 * different location added to the application more than once.
 *
 * @param module
 */
Application.prototype.addModule = function (name, path) {
  if (this._modules.hasOwnProperty (name))
    throw new Error (util.format ('duplicate module: %s', name));

  var appModule = new ApplicationModule (name, path);
  this._modules[name] = appModule;

  if (this._server && appModule.getSupportsViews ())
    this._server.importViews (appModule.getViewsPath ());

  if (this._policyManager && appModule._policyManager)
    this._policyManager.merge (appModule._policyManager)
};

module.exports = exports = Application;
