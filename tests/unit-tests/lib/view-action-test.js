const ViewAction = require ('../../../lib/view-action')
  , expect       = require ('chai').expect
  ;

describe ('lib | ViewAction', function () {
  context ('create()', function () {
    it ('should create an ViewAction', function () {
      let action = new ViewAction ();

      expect (action).to.be.instanceof (ViewAction);
    });
  });

  context ('doRequest(req, res)', function () {
    it ('should throw an Error if missing view()', function () {
      let action = new ViewAction ();
      expect (action.doRequest.bind (action)).to.throw (Error);
    });

    it ('should send a response from a view template', function (done) {
      let req = {};

      let res = {
        status (n) {
          this._status = n;
          return this;
        },

        render (view, data) {
          this.view = view;
          this.data = data;
        }
      };

      let action = new ViewAction ({
        view ()  { return 'helloworld.pug'; },
        model () { return {a: 1, b: 2}}
      });

      action.doRequest (req, res).then (() => {
        expect (res).to.have.property ('_status', 200);
        expect (res).to.have.property ('view', 'helloworld.pug');
        expect (res).to.have.deep.property ('data', {a: 1, b: 2});

        done (null);
      }).catch (err => done (err));
    });
  });
});
