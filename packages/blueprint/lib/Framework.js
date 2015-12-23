var semver  = require ('semver')
  , winston = require ('winston')
  ;

var Messaging = require ('./Messaging')
  , version   = require ('../package.json').version
  ;

/**
 * @class Framework
 *
 * @constructor
 *
 * The Framework class is a wrapper facade for the module. It contains the application
 * and the Messaging module.
 *
 * There can be only one Framework in the process.
 */
function Framework () {
  // Private application variable for the framework. This prevents outside
  // parties from changing the application variable directly.
  var app = undefined;

  Object.defineProperty (this, 'app', {
    get : function () {
      if (app !== undefined)
        return app;

      throw new Error ('Application not initialized; must call blueprint.Application (appPath) first');
    },
    set : function (value) {
      app = value;
    }
  });

  this.hasApplication = function () {
    return app !== undefined;
  };

  this.releaseApplication = function () {
    winston.log ('debug', 'releasing the application');
    app = undefined;
  };

  this.messaging = new Messaging ();
}

/**
 * Get the singleton instance of the framework that has been installed in the
 * main application.
 */
module.exports = exports = function () {
  if (process.mainModule.blueprint !== undefined)
    return process.mainModule.blueprint;

  winston.log ('debug', 'creating a new framework instance');
  process.mainModule.blueprint = new Framework ();
  return process.mainModule.blueprint;
};

/**
 * Destroy the framework.
 */
exports.destroy = function () {
  winston.log ('debug', 'destroying the framework');
  delete process.mainModule.blueprint;
};

/**
 * Define the framework version.
 */
exports.version = version;
