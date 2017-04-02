'use strict';

var expect    = require ('chai').expect
  , path      = require ('path')
  , Framework = require ('../../lib/Framework')
  , Messaging = require ('../../lib/Messaging')
  ;

describe ('Framework', function () {
  it ('should have a messaging property', function () {
    expect (Framework.messaging).to.be.instanceof (Messaging);
  });

  it ('should not have an application', function () {
    Framework.destroyApplication (function () {
      expect (Framework.app).to.be.null;
    });
  });

  it ('should have a version property', function () {
    var version = require ('../../package.json').version;
    expect (Framework.version).to.equal (version);
  });

  describe ('createApplication', function () {
    it ('should create an application in the framework', function (done) {
      const appPath = path.resolve (__dirname, '../fixtures/app');

      Framework.createApplication (appPath, function (err, app) {
        if (err)
          return done (err);

        expect (app.appPath).to.equal (appPath);
        expect (Framework.app).to.equal (app);

        return done (null);
      });
    });
  });
});