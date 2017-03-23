const blueprint = require ('@onehilltech/blueprint')
  , path = require ('path')
  , util = require ('util')
  , _    = require ('underscore')
  , lib  = require ('../../../lib')
  ;

const datamodel = require (path.resolve (__dirname, '../../fixtures/datamodel'));

describe ('lib.UserResourceController', function () {
  before (function (done) {
    datamodel.apply (done);
  });

  describe ('/friends', function () {
    describe ('POST', function () {
      it ('should create a resource with automated user', function (done) {
        var user =  new lib.Types.ObjectId ();

        var data = {
          _id: new lib.Types.ObjectId (),
          friend: datamodel.models.persons[0]._id
        };

        blueprint.testing.request ()
          .post ('/friends')
          .set ('user', user.toString ())
          .send ({friend: data})
          .expect (200, lib.testing.lean ({
            friend: {
              _id: data._id,
              friend: data.friend,
              person: user.toString ()
            }
          }), done);
      });

      it ('should overwrite the provided user', function (done) {
        var user =  new lib.Types.ObjectId ();

        var data = {
          _id: new lib.Types.ObjectId (),
          friend: datamodel.models.persons[0]._id,
          person: new lib.Types.ObjectId ()
        };

        blueprint.testing.request ()
          .post ('/friends')
          .set ('user', user.toString ())
          .send ({friend: data})
          .expect (200, lib.testing.lean ({
            friend: {
              _id: data._id,
              friend: data.friend,
              person: user.toString ()
            }
          }), done);
      });
    });
  });
});
