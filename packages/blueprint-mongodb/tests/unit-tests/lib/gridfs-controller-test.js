const testing  = require ('@onehilltech/blueprint-testing');
const path     = require ('path');
const {expect} = require ('chai');

describe ('lib | GridFSController', function () {
  let imageId;

  describe ('/images', function () {
    describe ('POST', function () {
      it ('should upload file, and store in database', function () {
        let imageFile = path.resolve ('./tests/data/avatar1.png');

        return testing.request ()
          .post ('/images')
          .attach ('image', imageFile)
          .expect (200)
          .then (res => {
            expect (res.body).to.have.keys (['image']);
            expect (res.body.image).to.have.keys ('_id');

            imageId = res.body.image._id;
          });
      });
    });
  });

  describe.skip ('/images/:imageId', function () {
    describe ('GET', function () {
      it ('should get the image from the database', function (done) {
        blueprint.testing.request ()
          .get ('/images/' + imageId)
          .expect (200, function (err, res) {
            if (err) return done (err);

            expect (res.type).to.equal ('image/png');

            return done ();
          });
      });

      it ('should not find the image', function (done) {
        blueprint.testing.request ()
          .get ('/images/5')
          .expect (400, done);
      });

      it ('does not support querying for resource', function (done) {
        blueprint.testing.request ()
          .get ('/images?filename=avatar1.png')
          .expect (404, done);
      })
    });

    describe ('PUT', function () {
      it ('should not update the image', function (done) {
        let imageFile = path.resolve (__dirname, '../../data/avatar2.png');

        blueprint.testing.request ()
          .put ('/images/' + imageId)
          .attach ('image', imageFile)
          .expect (404, done);
      });
    });

    describe ('DELETE', function () {
      it ('should delete the image from the database', function (done) {
        blueprint.testing.request ()
          .delete ('/images/' + imageId)
          .expect (200, 'true', done);
      });

      it ('should not delete the image again', function (done) {
        blueprint.testing.request ()
          .delete ('/images/' + imageId)
          .expect (500, done);
      });
    });
  });
});