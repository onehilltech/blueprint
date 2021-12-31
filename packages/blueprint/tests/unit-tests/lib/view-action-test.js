const ViewAction = require ('../../../lib/view-action')
  , expect       = require ('chai').expect
  ;

describe ('lib | ViewAction', function () {
  context ('create()', function () {
    it ('should create an ViewAction', function () {
      const action = new ViewAction ({ view () { return 'helloworld.pug'; }});
      expect (action).to.be.instanceof (ViewAction);
    });
  });

  context ('execute(req, res)', function () {
    it ('should send a response from a view template', function () {
      let req = {};

      let res = {
        render (view, data) {
          this.view = view;
          this.data = data;
        }
      };

      let action = new ViewAction ({
        view ()  { return 'helloworld.pug'; },
        model () { return {a: 1, b: 2}}
      });

      return action.execute (req, res).then (() => {
        expect (res).to.have.property ('view', 'helloworld.pug');
        expect (res).to.have.deep.property ('data', {a: 1, b: 2});
      });
    });
  });
});
