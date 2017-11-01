const Action = require ('../../../lib/action')
  , expect   = require ('chai').expect
;

describe ('lib | Action', function () {
  context ('create()', function () {
    it ('should create an Action', function () {
      let action = new Action ();

      expect (action).to.be.instanceof (Action);
    });
  });

  context ('doRequest', function () {
    it ('should validate, sanitize, and execute the request', function (done) {
      let action = new Action ({
        doValidate () {
          this.validate = true;
        },

        doSanitize () {
          this.sanitize = true;
        },

        doExecute () {
          this.execute = true;
        }
      });

      action.doRequest ({}, {}).then (() => {
        expect (action.validate).to.be.true;
        expect (action.sanitize).to.be.true;
        expect (action.execute).to.be.true;

        return done (null);
      }).catch (err => done (err))
    });
  });
});
