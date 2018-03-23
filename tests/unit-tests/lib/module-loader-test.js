const {expect} = require ('chai');
const path     = require ('path');
const Object   = require ('core-object');
const ModuleLoader = require ('../../../lib/module-loader');
const MessagingFramework = require ('../../../lib/messaging/framework');

const appPath = path.resolve (__dirname, '../../dummy/app');

describe ('lib | ModuleLoader', function () {
  describe ('constructor', function () {
    it ('should create a ModuleLoader', function () {
      let m = new ModuleLoader ({
        app: {
          appPath,
          messaging: new MessagingFramework ()
        }
      });

      expect (m).to.not.be.null;
    });
  });

  describe ('load', function () {
    it ('should the application modules', function (done) {
      let app = new Object ({
        appPath,
        messaging: new MessagingFramework (),
        modules: {},

        addModule (name, module) {
          this.modules[name] = module;
        }
      });

      let loader = new ModuleLoader ({app});

      loader.load ().then (() => {
        expect (app.modules).to.have.property ('mod_a');
        expect (app.modules).to.have.property ('mod_b');

        done (null);
      }).catch (done);
    });
  });
});
