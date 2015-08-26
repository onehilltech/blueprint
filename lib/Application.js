var winston = require ('winston')
  , path    = require ('path')
  , util    = require ('util')
  ;

var Server            = require ('./Server')
  , RouterBuilder     = require ('./RouterBuilder')
  , Configuration     = require ('./Configuration')
  , Database          = require ('./Database')
  , ApplicationModule = require ('./ApplicationModule')
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
  ApplicationModule.call (this, appPath);
}

util.inherits (Application, ApplicationModule);

/**
 * Initialize the application.
 */
Application.prototype.init = function () {
  winston.log ('info', 'application path: %s', this._appPath);

  // Load the configuration.
  var configPath = path.join (this._appPath, 'configs');
  this._config = Configuration (configPath, this.env);

  // Initialize the database object, if a configuration exists. If we
  // have a database configuration, then we can have models.
  if (this._config.database) {
    this._db = new Database (this._config['database']);

    // Force loading of the models.
    this.models;
  }

  var routersPath = path.resolve (this._appPath, 'routers');
  var routerBuilder = new RouterBuilder (routersPath, this.controllers);
  this._router = routerBuilder.addRouters (this.routers).getRouter ();
};

/**
 * Start the application.
 *
 * @param cb
 * @returns {Server|exports|module.exports}
 */
Application.prototype.makeServer = function () {
  var server = Server (this._appPath, this._config['server']);
  server.use (this._router);

  return server;
};

/**
 * Start the application. This method connects to the database, creates a
 * new server, and starts listening for incoming messages.
 *
 * @param callback
 */
Application.prototype.start = function (callback) {
  var self = this;

  function connected (err) {
    if (err)
      return callback (err);

    if (self._config['server']) {
      // Make a new server, and listen in the configured port.
      var port = self._config['server'].port || 8080;
      self._server = self.makeServer ();

      var http = self._server.listen (port, function () {
        var host = http.address ().address;
        var port = http.address ().port;

        winston.log ('info', 'listening at http://%s:%s...', host, port);
        callback ();
      });
    }
  }

  // If there is a database, connect to the database. Otherwise, proceed
  // with acting as if we are connected to an imaginary database.
  if (this._db)
    this._db.connect (connected);
  else
    connected (null);
}

Application.prototype.__defineGetter__ ('database', function () {
  return this._db;
});

module.exports = exports = Application;
