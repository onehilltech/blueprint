'use strict';

var npm = require ('npm')
  , async = require ('async')
  , winston = require ('winston')
  ;

function Installer (npm) {
  this._npm = npm;
}

Installer.prototype.install = function (depends, callback) {
  winston.log ('info', 'installing dependencies...');
  this._npm.commands.install (depends, callback);
};

Installer.prototype.uninstall = function (depends, callback) {
  winston.log ('info', 'uninstalling dependencies...');
  this._npm.commands.uninstall (depends, callback);
};

Installer.prototype.prune = function (callback) {
  this._npm.commands.prune (callback);
};

Installer.prototype.bin = function (callback) {
  winston.log ('info', 'installing binaries...');
  this._npm.commands.bin (callback);
};

function InstallerFactory (targetPath, config, callback) {
  config.prefix = targetPath;

  async.waterfall ([
    function (callback) {
      return npm.load (config, callback);
    },
    function (npm, callback) {
      return callback (null, new Installer (npm));
    }
  ], callback);
}

module.exports = InstallerFactory;
