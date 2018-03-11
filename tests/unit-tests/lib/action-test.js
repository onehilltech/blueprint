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
});
