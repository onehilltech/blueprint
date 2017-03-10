const fs              = require ('fs-extra')
  , path              = require ('path')
  , util              = require ('util')
  , async             = require ('async')
  , ApplicationModule = require ('./ApplicationModule')
  ;

const KEYWORD_BLUEPRINT_MODULE = 'blueprint-module';
const FILE_PACKAGE_JSON = 'package.json';

function isBlueprintModule (packageObj) {
  return packageObj.keywords && packageObj.keywords.indexOf (KEYWORD_BLUEPRINT_MODULE) !== -1;
}

function ModuleLoader (app, modulesPath) {
  this._express = app;
  this._modulesPath = modulesPath;
}

module.exports = ModuleLoader;

ModuleLoader.prototype.load = function (appPath, callback) {
  var packageFile = path.resolve (appPath, '..', FILE_PACKAGE_JSON);
  var self = this;
  var modules = {};

  fs.readJson (packageFile, function (err, packageObj) {
    if (err && err.code === 'ENOENT') err = null;
    if (err) return callback (err);
    if (!packageObj || !packageObj.dependencies) return callback (null);

    handleDependencies (packageObj.dependencies, callback);
  });

  function handleDependencies (dependencies, callback) {
    async.eachOf (dependencies, handleNodeModule, callback);
  }

  function handleNodeModule (version, name, callback) {
    // Open the package.json file for this node module, and determine
    // if the module is a Blueprint.js module.
    var modulePath  = path.resolve (self._modulesPath, name);
    var packageFile = path.resolve (modulePath, FILE_PACKAGE_JSON);

    fs.readJson (packageFile, function (err, packageObj) {
      if (err && err.code === 'ENOENT') return callback (null);
      if (err) return callback (err);

      if (isBlueprintModule (packageObj) && !modules[name]) {
        var appPath = path.resolve (modulePath, 'app');
        var module = new ApplicationModule (appPath);
        modules[name] = module;

        async.series ([
          function (callback) { handleDependencies (packageObj.dependencies, callback); },
          function (callback) { return module.init (callback); },
          function (callback) { return self._express.addModule (name, module, callback); }
        ], callback);
      }
      else {
        return callback (null);
      }
    });
  }
};
