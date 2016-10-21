var blueprint = require ('@onehilltech/blueprint')
  , path      = require ('path')
  , swagger   = require ('../../../lib/specification')
  , expect    = require ('chai').expect
  ;

describe ('specification', function () {
  before (function (done) {
    var appPath = path.resolve (__dirname, '../../fixtures/mock-app/app');
    blueprint.Application (appPath, done);
  });

  it ('should create a Swagger specification', function (done) {
    swagger (blueprint.app, function (err, spec) {
      if (err) return done (err);

      expect (spec).to.have.property ('swagger', '2.0');
      //expect (spec).to.have.property ('schemes', ['http']);

      return done (null);
    });
  });
});