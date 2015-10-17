var Messaging = require ('./Messaging')
  ;

function Framework () {
  this._app = undefined;
  this.messaging = new Messaging ();
}

Object.defineProperty (Framework.prototype, 'app', {
  get : function () {
    if (this._app !== undefined)
      return this._app;

    throw new Error ('Application not initialized; must call blueprint.Application (appPath) first');
  },
  set : function (app) {
    this._app = app;
  }
});

Framework.prototype.hasApplication = function () {
  return this._app !== undefined;
};

module.exports = exports = Framework;

/**
 * Get the singleton instance of the framework that has been installed in the
 * main application.
 */
exports.getInstance = function () {
  if (process.mainModule.blueprint !== undefined)
    return process.mainModule.blueprint;

  process.mainModule.blueprint = new Framework ();
  return process.mainModule.blueprint;
};