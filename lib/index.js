'use strict';

var exports = module.exports = require ('./Framework');

const util = require ('util')
  , async  = require ('async')
  , Env    = require ('./Environment')
  , BaseController = require ('./BaseController')
  ;

exports.BaseController = exports.Controller = BaseController;
exports.ResourceController = require ('./ResourceController');

exports.Policy = require ('./Policy');
exports.ModuleRouter = require ('./ModuleRouter');

exports.http = require ('./http');
exports.errors = require ('./errors');
exports.barrier = require ('./Barrier');

// Make sure Blueprint has been instantiated in the main process. This instance
// is used by the current application, and its dependencies to ensure operate in
// the same address space without version problems.


Object.defineProperty (exports, 'testing', {
  get: function () { return require ('./testing'); }
});

/**
 * Get the current Node.js environment. The default Node.js environment is development.
 */
Object.defineProperty (exports, 'env', {
  get: function () { return Env.name }
});

/**
 * Helper method to define different controllers. This method ensures the controller
 * is an instance of BaseController.
 */
exports.controller = function (controller, base) {
  base = base || BaseController;
  util.inherits (controller, base);
};
