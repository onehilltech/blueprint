var winston = require ('winston')
  , path    = require ('path')
  , all     = require ('require-all')
  ;

var Server        = require ('./Server')
  , RouterBuilder = require ('./RouterBuilder')
  , Configuration = require ('./Configuration')
  , Database      = require ('./Database')
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
  this._appPath = path.resolve (appPath);
  this._isInit = false;
}

Application.prototype.init = function () {
  if (this._isInit)
    throw new Error ('application is already initialized');

  winston.log ('info', 'application path: %s', this._appPath);

  // Load the configuration.
  var configPath = path.join (this._appPath, 'configs');
  this._config = Configuration (configPath, this.env);

  // Initialize the database object, if a configuration exists. If we
  // have a database configuration, then we can have models.
  if (this._config.database) {
    this._db = new Database (this._config['database']);

    // Load all the models into memory.
    winston.info('loading application models into memory')
    this._models = all({
      dirname: path.join(this._appPath, 'models'),
      filter: /(.+)\.js$/,
      excludeDirs: /^\.(git|svn)$/
    });
  }

  // Load all the controllers into memory.
  winston.info ('loading application controllers into memory')
  this._controllers = all ({
    dirname     :  path.join (this._appPath, 'controllers'),
    filter      :  /(.+Controller)\.js$/,
    excludeDirs :  /^\.(git|svn)$/,
    resolve     : function (Controller) {
      winston.log ('info', 'instantiating controller %s...', Controller.name);
      return new Controller ();
    }
  });

  // Load all the routers into memory, and bind to the controllers. Once the routers,
  // are built, instruct the server to use the built routers.
  winston.info ('loading router blueprints into memroy')
  var routersPath = path.join (this._appPath, 'routers');
  var routers = all ({
    dirname     :  routersPath,
    filter      :  /(.+Router)\.js$/,
    excludeDirs :  /^\.(git|svn)$/,
  });

  winston.info ('building application router from router blueprints');
  var routerBuilder = new RouterBuilder (routersPath, this._controllers);
  this._router = routerBuilder.build (routers).getRouter ();

  // The application is now initialized.
  this._isInit = true;
};

/**
 * Start the application.
 *
 * @param cb
 * @returns {Server|exports|module.exports}
 */
Application.prototype.makeServer = function () {
  var server = new Server (this._appPath, this._config['server']);
  server.use (this._router);

  return server;
};

Application.prototype.start = function (callback) {
  var self = this;

  function connected (err) {
    if (err)
      return callback (err);

    self.makeServer ().listen ();
    callback (null);
  }

  // If there is a database, connect to the database. Otherwise, proceed
  // with acting as if we are connected to an imaginary database.
  if (this._db)
    this._db.connect (connected);
  else
    connected (null);
}

/**
 * Get the models defined by the application.
 */
Application.prototype.__defineGetter__ ('models', function () {
  return this._models;
});

Application.prototype.__defineGetter__ ('env', function () {
  return process.env.NODE_ENV || 'dev';
});

Application.prototype.__defineGetter__ ('controllers', function () {
  return this._controllers;
});

Application.prototype.__defineGetter__ ('database', function () {
  return this._db;
});

Application.prototype.__defineGetter__ ('router', function () {
  return this._router;
});

module.exports = exports = Application;

exports.Schema = Database.Schema;
