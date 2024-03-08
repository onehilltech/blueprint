const ViewAction = require ('../../../src/lib/view-action')
  , expect       = require ('chai').expect
  ;

class TestViewAction extends ViewAction {
  async view (req) { return 'helloworld.pug'; }

  async model (req) {
    return {
      a: 1, b: 2
    }
  }
}

describe ('lib | ViewAction', function () {
  context ('create()', function () {
    it ('should create an ViewAction', function () {
      expect (new TestViewAction ()).to.be.instanceof (ViewAction);
    });
  });

  context ('execute(req, res)', function () {
    it ('should send a response from a view template', function () {
      const req = {};
      const res = {
        render (view, data) {
          this.view = view;
          this.data = data;
        }
      };

      const action = new TestViewAction ();

      return action.execute (req, res).then (() => {
        expect (res).to.have.property ('view', 'helloworld.pug');
        expect (res).to.have.deep.property ('data', {a: 1, b: 2});
      });
    });
  });
});
