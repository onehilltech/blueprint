const {request} = require ('@onehilltech/blueprint-testing');
const blueprint = require ('@onehilltech/blueprint');
const path      = require ('path');
const {expect}  = require ('chai');

const {
  Types: {
    ObjectId
  }
} = require ('mongoose');

const imageFile1 = path.resolve ('./tests/data/avatar1.png');
const imageFile2 = path.resolve ('./tests/data/avatar2.png');

describe ('lib | GridFSController', function () {
  beforeEach (async function () {
    const imageController = blueprint.lookup ('controller:image');

    try {
      await imageController.drop ();
    }
    catch (err) {
      if (err.code === 26)
        return null;

      throw err;
    }
  });

  describe ('create', function () {
    it ('should upload file, and store in database', async function () {

      const res = await request ()
        .post ('/images')
        .attach ('image', imageFile1)
        .expect (200);

      expect (res.body).to.have.keys (['image']);
      expect (res.body.image).to.have.keys ('_id');
    });
  });

  describe ('getOne', async function () {
    it ('should get the image from the database', async function () {
      this.timeout (10000);

      const res1 = await request ()
        .post ('/images')
        .attach ('image', imageFile1)
        .expect (200);

      const { image: { _id: imageId }} = res1.body;

      const res2 = await request ()
        .get (`/images/${imageId}`)
        .expect (200);

      expect (res2.type).to.equal ('image/png');
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

      request ()
        .put (`/images/${id}`)
        .attach ('image', imageFile2)
        .expect (404, done);
    });
  });

  describe ('delete', function () {
    this.timeout (10000);

    it ('should delete the image from the database', function () {
      return request ()
        .post ('/images')
        .attach ('image', imageFile1)
        .then ((res) => {
          const imageId = res.body.image._id;

          return request ()
            .delete (`/images/${imageId}`)
            .expect (200, 'true');
        });
    });

    it ('should not delete the image again', function () {
      return request ()
        .post ('/images')
        .attach ('image', imageFile1)
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