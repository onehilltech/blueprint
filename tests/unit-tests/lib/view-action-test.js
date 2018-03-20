const ViewAction = require ('../../../lib/view-action')
  , expect       = require ('chai').expect
  ;

describe ('lib | ViewAction', function () {
  context ('create()', function () {
    it ('should create an ViewAction', function () {
      let action = new ViewAction ({view () { return 'helloworld.pug'; }});
      expect (action).to.be.instanceof (ViewAction);
    });
  });

  context ('execute(req, res)', function () {
    it ('should throw an Error if missing view()', function () {
      expect (() => { new ViewAction () }).to.throw (Error);
    });

    it ('should send a response from a view template', function (done) {
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

      action.execute (req, res).then (() => {
        expect (res).to.have.property ('view', 'helloworld.pug');
        expect (res).to.have.deep.property ('data', {a: 1, b: 2});

        done (null);
      }).catch (err => done (err));
    });
  });
});
