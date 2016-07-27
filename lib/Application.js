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

  this._init = false;
  this._modules = {};
}

util.inherits (Application, ApplicationModule);

/**
 * Initialize the application.
 */
Application.prototype.init = function () {
  if (this._init === true)
    throw new Error ('Application already initialized');

  winston.log ('info', 'application path: %s', this.appPath);

  // First, make sure there is a data directory. This is where the application stores
  // all its internal information.
  var dataPath = Path.resolve (this.appPath, 'data');
  dataPath.createIfNotExists ();

  // Load all configurations first. This is because other entities in the
  // application may need the configuration object for initialization.
  var configPath = path.join (this.appPath, 'configs');
  this._config = Configuration (configPath, Env.name);

  // Initialize the database object, if a configuration exists. If we
  // have a database configuration, then we can have models.
  if (this._config['database']) {
    winston.log ('info', 'application has database support');

    this._db = new Database (this._config['database']);
    this._db.setMessenger (Framework ().messaging);

    // Force loading of the models since we have a database. If there
    // was not database in the application, then we would not load any
    // of the models.
    winston.log ('info', 'loading models into memory')
    this.models;
  }

  // Make the server object.
  this._server = new Server (this.appPath, this._config['server']);

  if (this.getSupportsViews ())
    this._server.importViews (this.getViewsPath ());

  // Import the views of all the modules.
  for (var name in this._modules) {
    if (this._modules.hasOwnProperty (name)) {
      var module = this._modules[name];

      if (module.getSupportsViews ())
        this._server.importViews (module.getViewsPath ());
    }
  }

  // Load the policies.
  var policiesPath = Path.resolve (this.appPath, 'policies');

  if (policiesPath.exists ())
    this.policies;

  // Make the router for the application. Then, install the router in the
  // server object. Part of loading the routers requires force loading of
  // the controllers. Otherwise, the router builder will not be able to
  // resolve any of the defined actions.
  var routersPath = path.resolve (this.appPath, 'routers');
  var routerBuilder = new RouterBuilder (routersPath, this.controllers);

  this._router = routerBuilder.addRouters (this.routers).getRouter ();

  // Set the main router for the server.
  this._server.setMainRouter (this._router);

  // Notify all listeners the application is initialized.
  Framework().messaging.emit ('app.init', this);
  this._init = true;
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

    self._server.listen (function () {
      // Emit that the application has started.
      Framework().messaging.emit ('app.start', self);

      // Process the done() method on the next tick.
      process.nextTick (done);
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
