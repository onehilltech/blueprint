var expect = require ('chai').expect
  , path = require ('path')
  , ModuleLoader = require ('../../lib/ModuleLoader')
  ;

describe ('ModuleLoader', function () {
  describe ('load', function () {
    it ('should load module in the application path', function (done) {
      var modulesPath = path.resolve (__dirname, '../../node_modules');
      var appPath = path.resolve (__dirname, '../fixtures/app');
      var loader = new ModuleLoader (modulesPath);
      var modules = {};

      loader.on ('module', function (name, module) {
        modules[name] = module;
      });

      loader.on ('error', done);
      loader.on ('done', function () {
        expect (modules).to.have.keys (['@onehilltech/blueprint-dummy-module1', '@onehilltech/blueprint-dummy-module2']);
        return done ();
      });

      loader.load (appPath);
    });
  });
});
