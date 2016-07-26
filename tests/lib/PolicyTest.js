var expect = require ('chai').expect
  , async  = require ('async')
  , path   = require ('path')
  ;

var blueprint = require ('../fixtures/blueprint')
  , datamodel = require ('../fixtures/datamodel')
  , HttpError = blueprint.errors.HttpError
  ;

var Policy = require ('../../lib/Policy')
  ;

function passthrough (result, req, callback) {
  return callback (null, result);
}

describe ('Policy', function () {
  var appPath = path.resolve (__dirname, '../fixtures/app');

  before (function () {
    blueprint.destroy ();
    blueprint.Application (appPath);
  });

  describe ('#assert', function () {
    it ('should create an assertion that evaluates to true', function (done) {
      var f = Policy.assert (passthrough, true);

      f (null, function (err, result) {
        expect (err).to.be.null;
        expect (result).to.be.true;

        return done ();
      });
    });

    describe ('#', function () {
      it ('should export several functions', function () {
        expect (Policy).to.be.a.function;
        expect (Policy.assert).to.be.a.function;
        expect (Policy.and).to.be.a.function;
        expect (Policy.or).to.be.a.function;
        expect (Policy.not).to.be.a.function;
      });

      it ('should return a successful evaluation', function (done) {
        Policy (
          Policy.assert (passthrough, true)
        ).evaluate (null, done);
      });

      it ('should return an error for the evaluation', function (done) {
        Policy (
          Policy.assert (passthrough, false)
        ).evaluate (null, function (err) {
          expect (err).to.be.instanceof (HttpError);
          return done ();
        });
      });
    });

    it ('should create an assertion from existing application policy', function (done) {
      var f = Policy.assert ('always_true');

      f (null, function (err, result) {
        expect (err).to.be.null;
        expect (result).to.be.true;

        return done ();
      });
    });
  });

  describe ('#and', function () {
    it ('should evaluate to true since all asserts are true', function () {
      var policy = Policy.and ([
        Policy.assert (passthrough, true),
        Policy.assert (passthrough, true)
      ]);

      policy (null, function (err, result) {
        expect (err).to.be.null;
        expect (result).to.be.true;
      });
    });

    it ('should evaluate to false since 1 assertion is false', function () {
      var policy = Policy.and ([
        Policy.assert (passthrough, true),
        Policy.assert (passthrough, false)
      ]);

      policy (null, function (err, result) {
        expect (err).to.be.null;
        expect (result).to.be.false;
      });
    });
  });

  describe ('#or', function () {
    it ('should evaluate true since 1 assertion is true', function () {
      var policy = Policy.or ([
        Policy.assert (passthrough, true),
        Policy.assert (passthrough, false)
      ]);

      policy (null, function (err, result) {
        expect (err).to.be.null;
        expect (result).to.be.true;
      });
    });

    it ('should evaluate false since all assertions are false', function () {
      var policy = Policy.or ([
        Policy.assert (passthrough, false),
        Policy.assert (passthrough, false)
      ]);

      policy (null, function (err, result) {
        expect (err).to.be.null;
        expect (result).to.be.false;
      });
    });
  });

  describe ('#not', function () {
    it ('should evaluate the negation policy', function () {
      var policy = Policy.not (Policy.assert (passthrough, true));

      policy (null, function (err, result) {
        expect (err).to.be.null;
        expect (result).to.be.false;
      });
    });
  });
});