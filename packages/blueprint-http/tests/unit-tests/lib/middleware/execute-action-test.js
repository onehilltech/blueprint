const executeAction = require ('../../../../lib/middleware/execute-action');
const Action = require ('../../../../lib/action');

const {expect} = require ('chai');

describe ('lib | middleware | executeAction', function () {
  it ('should execute promise without error', function (done) {
    class TestAction extends Action {
      async execute () {
        return true;
      }
    }

    const req = {};
    const res = {};

    const middleware = executeAction (new TestAction ());

    middleware (req, res, (err) => {
      expect (err).to.be.undefined;
      done (null);
    });
  });

  it ('should execute promise that fails', function (done) {
    class TestAction extends Action {
      async execute () {
        throw new Error ('This execution failed');
      }
    }

    const req = {};
    const res = {};

    const middleware = executeAction (new TestAction ());

    middleware (req, res, (err) => {
      expect (err.message).to.equal ('This execution failed');
      done (null);
    });
  });
});
