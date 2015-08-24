var winston = require ('winston')
  , path    = require ('path')
  , all     = require ('require-all')
  ;

var RouterBuilder = require ('./RouterBuilder')
  , Database      = require ('./Database')
  ;

/**
 * @class ApplicationModule
 *
 * Application that is loaded via the node_modules.
 *
 * @param appPath
 * @constructor
 */
function ApplicationModule (appPath) {
  this._appPath = path.resolve (appPath);
  this._controllers = this._models = this._routers = undefined;
}

/**
 * Get the models defined by the application.
 */
ApplicationModule.prototype.__defineGetter__ ('models', function () {
  if (this._models)
    return this._models;

  // Load all the models into memory.
  winston.log ('debug', 'loading application models into memory');
  this._models = all({
    dirname: path.join (this._appPath, 'models'),
    filter: /(.+)\.js$/,
    excludeDirs: /^\.(git|svn)$/
  });

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
  this._controllers = all ({
    dirname     :  path.join (this._appPath, 'controllers'),
    filter      :  /(.+Controller)\.js$/,
    excludeDirs :  /^\.(git|svn)$/,
    resolve     : function (Controller) {
      winston.log ('debug', 'instantiating controller %s', Controller.name);
      return new Controller ();
    }
  });
});

/**
 * Get the controllers defined by the application.
 */
ApplicationModule.prototype.__defineGetter__ ('routers', function () {
  if (this._routers)
    return this._routers;

  // Load all the routers into memory.
  winston.log ('debug', 'loading application routers into memory');

  var routerPath =  path.join (this._appPath, 'routers');
  this._routers = all ({
    dirname     :  routerPath,
    filter      :  /(.+Router)\.js$/,
    excludeDirs :  /^\.(git|svn)$/,
    resolve     : function (routes) {
      winston.log ('debug', 'building router %s', routes);

      var builder = new RouterBuilder (routerPath, this.controllers);
      return builder.addRouter (routes).getRouter ();
    }
  });

  return this._routers;
});

ApplicationModule.prototype.__defineGetter__ ('env', function () {
  return process.env.NODE_ENV || 'dev';
});

module.exports = exports = ApplicationModule;
exports.Schema = Database.Schema;
