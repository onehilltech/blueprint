var semver = require ('semver')
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

      throw new Error ('Application not initialized; must call xpression.Application (appPath) first');
    },
    set : function (value) {
      app = value;
    }
  });

  this.hasApplication = function () {
    return app !== undefined;
  };

  this.messaging = new Messaging ();
}

/**
 * Get the singleton instance of the framework that has been installed in the
 * main application.
 */
module.exports = exports = function () {
  if (process.mainModule.xpression !== undefined)
    return process.mainModule.xpression;

  process.mainModule.xpression = new Framework ();
  return process.mainModule.xpression;
};

/**
 * Destroy the framework.
 */
exports.destroy = function () {
  delete process.mainModule.xpression;
};

/**
 * Define the framework version.
 */
exports.version = version;
