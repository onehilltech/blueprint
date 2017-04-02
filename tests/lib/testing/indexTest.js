'use strict';

const path    = require ('path')
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
});