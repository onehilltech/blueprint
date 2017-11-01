const LegacyFunctionAction = require ('../../../lib/legacy-function-action')
  , expect = require ('chai').expect
  ;

function legacyNoCallback (req, res) {
  res.status = 200;
}

function legacyWithCallback (req, res, callback) {
  res.status = 300;
  callback (null);
}

describe ('lib | LegacyFunctionAction', function () {
  context ('create()', function () {
    it ('should create an AbstractAction', function () {
      let action = new LegacyFunctionAction ({action: legacyNoCallback});

      expect (action).to.be.instanceof (LegacyFunctionAction);
      expect (action).to.have.property ('action').is.a ('function')
    });
  });

  context ('doRequest()', function () {
    context ('no callback', function () {
      let action = new LegacyFunctionAction ({action: legacyWithCallback});
      let req = {};
      let res = {};

      action.doRequest (req, res).then (() => {
        expect (req).to.have.property ('status', 300);
      }).catch (reason => done (reason));
    });

    context ('callback', function (done) {
      let action = new LegacyFunctionAction ({action: legacyWithCallback});
      let req = {};
      let res = {};

      action.doRequest (req, res).then (() => {
        expect (req).to.have.property ('status', 200);
        done (null);
      }).catch (reason => done (reason));
    });
  });
});
