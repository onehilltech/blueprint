var expect = require ('chai').expect
  , path   = require ('path')
  ;

var blueprint = require ('../fixtures/blueprint')
  ;

describe ('lib', function () {
  describe ('#app', function () {
    it ('should create a new Application', function () {
      expect (blueprint.app).to.equal (process.mainModule.blueprint.app);
    });
  });
});