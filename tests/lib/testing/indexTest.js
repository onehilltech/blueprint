'use strict';

const path    = require ('path')
  , expect    = require ('chai').expect
  , async     = require ('async')
  , testing   = require ('../../../lib/testing')
  , blueprint = require ('../../../lib')
  , messaging = blueprint.messaging
  ;

describe ('testing', function () {
  describe ('waitFor', function () {
    it ('should wait for a condition to continue', function (done) {
      var recv = false;

      messaging.on ('waitFor.complete', function () {
        recv = true;
      });

      messaging.emit ('waitFor.complete');

      testing.waitFor (function () {
        return recv;
      }, done);
    });
  });

  describe ('createApplicationAndStart', function () {
    //before (function (done) {
      //blueprint.destroyApplication (done);
    //});

    it ('should create an application and start it', function (done) {
      async.waterfall ([
        function (callback) {
          const appPath = path.resolve (__dirname, '../../fixtures/app');
          testing.createApplicationAndStart (appPath, callback);
        },

        function (app, callback) {
          expect (app.isStarted).to.be.true;
          return callback (null);
        }
      ], done);
    });
  });
});