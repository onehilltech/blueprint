var blueprint = require ('@onehilltech/blueprint')
  , async     = require ('async')
  , expect    = require ('chai').expect
  , appPath   = require ('../../../fixtures/appPath')
  , clearData = require ('../../../../lib/testing/clearData')
  ;

describe ('lib.testing.clearData', function () {
  before (function (done) {
    async.waterfall ([
      function (callback) {
        blueprint.testing.createApplicationAndStart (appPath, callback);
      },

      function (app, callback) {
        var degree = { degree: 'PhD', major: 'Computer Science', school: 'Vanderbilt University' };

        async.waterfall ([
          function (callback) { app.models.Degree.remove ({}, callback); },
          function (result, callback) { app.models.Degree.create (degree, callback); },
          function (result, callback) {
            expect (result).to.not.be.null;
            return callback (null);
          }
        ], callback);
      }
    ], done);
  });

  it ('should clear all data in the database', function (done) {
    async.waterfall ([
      function (callback) { clearData (callback); },
      function (callback) { blueprint.app.models.Degree.find ({}, callback); },
      function (result, callback) {
        expect (result).to.have.length (0);
        return callback (null);
      }
    ], done);
  });
});
