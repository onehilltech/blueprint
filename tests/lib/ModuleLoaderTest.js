'use strict';

const expect = require ('chai').expect
  , path     = require ('path')
  , ModuleLoader = require ('../../lib/ModuleLoader')
  , Messaging    = require ('../../lib/Messaging')
  ;

describe ('ModuleLoader', function () {
  describe ('load', function () {
    it ('should load module in the application path', function (done) {
      var modulesPath = path.resolve (__dirname, '../../node_modules');
      var appPath = path.resolve (__dirname, '../fixtures/app');
      var modules = {};

      var mockApp =  {
        addModule: function (name, module, callback) {
          modules[name] = module;
          return callback (null);
        },

        messaging: new Messaging ()
      };

      var loader = new ModuleLoader (mockApp, modulesPath);

      loader.load (appPath, function (err) {
        if (err) return done (err);

        expect (modules).to.have.keys (['@onehilltech/blueprint-dummy-module1', '@onehilltech/blueprint-dummy-module2']);
        return done ();
      });
    });
  });
});
