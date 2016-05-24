var expect  = require ('chai').expect
  , async   = require ('async')
  ;

var ResourceController = require ('../../lib/ResourceController')
  , HttpError = require ('../../lib/errors/HttpError')
  ;

describe ('ResourceController', function () {
  function passthrough (result, req, callback) {
    return callback (null, result);
  }

  describe ('#check', function () {
    it ('should create a new check function', function () {
      var f = ResourceController.check (passthrough, true);

      expect (f).to.be.a.function;
    });

    it ('should evaluate to true', function (done) {
      var f = ResourceController.check (passthrough, true);

      f (null, function (err, result) {
        expect (err).to.be.null;
        expect (result).to.be.true;

        return done ();
      });
    });
  });

  describe ('#runChecks', function () {
    it ('should pass all checks', function () {
      ResourceController.runChecks ([
        ResourceController.check (passthrough, true),
        ResourceController.check (passthrough, true)
      ], null, function (result) {
        expect (result).to.be.undefined;
      });
    });

    it ('should should fail one of the checks', function () {
      ResourceController.runChecks ([
        ResourceController.check (passthrough, true),
        ResourceController.check (passthrough, false)
      ], null, function (result) {
        expect (result).to.be.instanceof (HttpError);
      });
    });
  });
});