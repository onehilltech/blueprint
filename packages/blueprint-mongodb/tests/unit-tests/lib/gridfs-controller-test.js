const {request} = require ('@onehilltech/blueprint-testing');
const blueprint = require ('@onehilltech/blueprint');
const path      = require ('path');
const {expect}  = require ('chai');

const {
  Types: {
    ObjectId
  }
} = require ('mongoose');

describe ('lib | GridFSController', function () {
  beforeEach (function () {
    let imageController = blueprint.lookup ('controller:image');

    return imageController.drop ().catch (err => {
      if (err.code === 26)
        return null;

      return Promise.reject (err);
    });
  });

  describe ('create', function () {
    it ('should upload file, and store in database', function () {
      let imageFile = path.resolve ('./tests/data/avatar1.png');

      return request ()
        .post ('/images')
        .attach ('image', imageFile)
        .expect (200)
        .then (res => {
          expect (res.body).to.have.keys (['image']);
          expect (res.body.image).to.have.keys ('_id');
        });
    });
  });

  describe ('getOne', function () {
    it ('should get the image from the database', function () {
      let imageFile = path.resolve ('./tests/data/avatar1.png');

      return request ()
        .post ('/images')
        .attach ('image', imageFile)
        .expect (200).then (res => {
          const imageId = res.body.image._id;

          return request ()
            .get (`/images/${imageId}`)
            .expect (200).then (res => {
              expect (res.type).to.equal ('image/png');
            });
        });
    });

    it ('should not find the image', function () {
      const id = new ObjectId ();

      return request ()
        .get (`/images/${id}`)
        .expect (404, { errors:
            [ { code: 'not_found',
              detail: 'The resource does not exist.',
              status: '404' } ] });
    });
  });

  describe ('getAll', function () {
    it ('does not support querying for resource', function (done) {
      request ()
        .get ('/images?filename=avatar1.png')
        .expect (404, done);
    })
  });

  describe ('update', function () {
    it ('should not update the image', function (done) {
      const id = new ObjectId ();
      const imageFile = path.resolve ('./tests/data/avatar2.png');

      request ()
        .put (`/images/${id}`)
        .attach ('image', imageFile)
        .expect (404, done);
    });
  });

  describe ('delete', function () {
    it ('should delete the image from the database', function () {
      let imageFile = path.resolve ('./tests/data/avatar1.png');

      return request ()
        .post ('/images')
        .attach ('image', imageFile)
        .then ((res) => {
          const imageId = res.body.image._id;

          return request ()
            .delete (`/images/${imageId}`)
            .expect (200, 'true');
        });
    });

    it ('should not delete the image again', function () {
      let imageFile = path.resolve ('./tests/data/avatar1.png');

      return request ()
        .post ('/images')
        .attach ('image', imageFile)
        .expect (200)
        .then ((res) => {
          const imageId = res.body.image._id;

          return request ()
            .delete (`/images/${imageId}`)
            .then (() => {
              return request ()
                .delete (`/images/${imageId}`)
                .expect (404, { errors:
                    [ { code: 'not_found',
                      detail: 'The resource does not exist.',
                      status: '404' } ] });
            });
        });
    });
  });
});