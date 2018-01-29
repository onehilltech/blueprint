const ApplicationModule = require ('../../../lib/application-module');
const path = require ('path');
const {expect} = require ('chai');

describe ('lib | ApplicationModule', function () {
  describe ('constructor()', function () {
    it ('should create a new ApplicationModule', function () {
      let modulePath = path.resolve (__dirname, '../../fixtures/app-module');
      let appModule = new ApplicationModule ({modulePath});

      expect (appModule).to.deep.include ({modulePath, _resources: {}});
    });
  });

  describe ('load()', function () {
    it ('should load an application module into memory', function (done) {
      let modulePath = path.resolve (__dirname, '../../fixtures/app-module');
      let appModule = new ApplicationModule ({modulePath});

      appModule.load ().then (result => {
        expect (appModule).to.equal (result);

        expect (result._resources).to.have.nested.property ('models.person');
        expect (result._resources).to.have.nested.property ('models.logger');
        expect (result._resources).to.not.have.nested.property ('models.monitor');

        expect (result._resources).to.have.property ('listeners').to.have.property ('blueprint.module.init');

        done (null);
      }).catch (err => done (err));
    });
  });
});