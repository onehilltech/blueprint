const {expect}  = require ('chai');
const {resolve} = require ('path');
const blueprint = require ('@onehilltech/blueprint');

const {
  Types: {
    ObjectId
  }
} = require ('mongoose');

describe ('lib | ResourceController', function () {
  beforeEach (function () {
    const appPath = resolve ('./tests/dummy/app');

    return blueprint.createApplicationAndStart (appPath)
      .then (() => blueprint.lookup ('model:author').remove ());
  });

  afterEach (function () {
    return blueprint.destroyApplication ();
  });

  describe ('constructor', function () {
    it ('should create a resource controller', function () {
      const Author = blueprint.lookup ('model:author');
      const controller = blueprint.lookup ('controller:author');

      expect (controller).to.have.property ('model', Author);
      expect (controller).to.have.property ('name', 'author');
      expect (controller).to.have.property ('resourceId', 'authorId');
    });
  });

  describe ('create', function () {
    it ('should create a resource', function () {
      const author = {_id: new ObjectId ().toString (), name: 'James H. Hill'};

      return blueprint.testing.request ()
        .post ('/authors')
        .send ({author})
        .expect (200, {author: Object.assign ({}, {__v: 0}, author)});
    });
  });

  describe ('getAll', function () {
    it ('should get all resources', function () {
      const Author = blueprint.lookup ('model:author');
      const author = {_id: new ObjectId ().toString (), name: 'James H. Hill'};
      const result = {authors: [Object.assign ({}, {__v: 0}, author)]};

      return Author.create (author)
        .then (() => {
          return blueprint.testing.request ()
            .get ('/authors')
            .expect (200, result);
        });
    });
  });

  describe ('getOne', function () {
    it ('should get one single resource', function () {
      const Author = blueprint.lookup ('model:author');
      const author = {_id: new ObjectId ().toString (), name: 'James H. Hill'};
      const result = {author: Object.assign ({}, {__v: 0}, author)};

      return Author.create (author)
        .then (() => {
          return blueprint.testing.request ()
            .get (`/authors/${author._id}`)
            .expect (200, result);
        });
    });
  });

  describe ('delete', function () {
    it ('should delete a single resource', function () {
      const Author = blueprint.lookup ('model:author');
      const author = {_id: new ObjectId ().toString (), name: 'James H. Hill'};

      return Author.create (author)
        .then (() => {
          return blueprint.testing.request ()
            .delete (`/authors/${author._id}`)
            .expect (200, 'true');
        });
    });
  });
});