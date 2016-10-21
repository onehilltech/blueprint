var blueprint = require ('@onehilltech/blueprint')
  , path      = require ('path')
  , async     = require ('async')
  , swagger   = require ('../../../lib/specification')
  ;

describe ('specification', function () {
  before (function (done) {
    var appPath = path.resolve (__dirname, '../../fixtures/mock-app/app');
    blueprint.Application (appPath, done);
  });

  it ('should create a Swagger specification', function (done) {
    async.waterfall ([
      function (callback) { swagger (blueprint.app, callback); },

      function (spec, callback) {

        return callback (null);
      }
    ], done);
  });
});