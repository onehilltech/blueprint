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

        expect (result).to.have.nested.property ('_resources.models.person');
        expect (result).to.have.nested.property ('_resources.models.logger');
        expect (result).to.not.have.nested.property ('_resources.models.monitor');

        done (null);
      }).catch (err => done (err));
    });
  });
});