const AbstractAction = require ('../../../lib/abstract-action')
  , expect = require ('chai').expect
  , assert = require ('assert')
  ;

describe ('lib | AbstractAction', function () {
  context ('create()', function () {
    it ('should create an AbstractAction', function () {
      let action = new AbstractAction ();

      expect (action).to.be.instanceof (AbstractAction);
    });
  });

  context ('execute(req, res)', function () {
    let action = new AbstractAction ();

    expect (action.execute).to.be.null;
  });
});
