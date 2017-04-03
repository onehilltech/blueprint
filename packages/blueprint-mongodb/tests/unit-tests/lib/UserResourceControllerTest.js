'use strict';

const blueprint = require ('@onehilltech/blueprint')
  , util    = require ('util')
  , mongodb = require ('../../../lib')
  ;

describe ('mongodb.UserResourceController', function () {
  describe ('/friends', function () {
    describe ('POST', function () {
      it ('should create a resource with automated user', function (done) {
        var user =  new mongodb.Types.ObjectId ();

        var data = {
          _id: new mongodb.Types.ObjectId (),
          friend: blueprint.app.seeds.$default.persons[0]._id
        };

        blueprint.testing.request ()
          .post ('/friends')
          .set ('user', user.toString ())
          .send ({friend: data})
          .expect (200, mongodb.lean ({
            friend: {
              _id: data._id,
              friend: data.friend,
              person: user.toString ()
            }
          }), done);
      });

      it ('should overwrite the provided user', function (done) {
        var user =  new mongodb.Types.ObjectId ();

        var data = {
          _id: new mongodb.Types.ObjectId (),
          friend: blueprint.app.seeds.$default.persons[0]._id,
          person: new mongodb.Types.ObjectId ()
        };

        blueprint.testing.request ()
          .post ('/friends')
          .set ('user', user.toString ())
          .send ({friend: data})
          .expect (200, mongodb.lean ({
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
