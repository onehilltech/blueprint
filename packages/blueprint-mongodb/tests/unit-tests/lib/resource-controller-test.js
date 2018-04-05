const {expect}  = require ('chai');
const blueprint = require ('@onehilltech/blueprint');
const testing   = require ('@onehilltech/blueprint-testing');

const {
  Types: {
    ObjectId
  }
} = require ('mongoose');

describe ('lib | ResourceController', function () {
  beforeEach (function () {
    return blueprint.lookup ('model:author').remove ();
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

      return testing.request ()
        .post ('/authors')
        .send ({author})
        .expect (200, {author: Object.assign ({}, {__v: 0}, author)});
    });

    it ('should call each subclass method', function () {
      const author = {_id: new ObjectId ().toString (), name: 'James H. Hill'};

      return testing.request ()
        .post ('/callbacks')
        .send ({author})
        .then (() => {
          let controller = blueprint.lookup ('controller:callbacks');
          expect (controller.createCallbacks).to.eql ([
            'prepareDocument',
            'preCreateModel',
            'createModel',
            'postCreateModel',
            'prepareResponse'
          ]);
        });
    });

    it ('should not create duplicate resources', function () {
      const author = {_id: new ObjectId ().toString (), name: 'James H. Hill'};

      return testing.request ()
        .post ('/authors')
        .send ({author})
        .then (() => {
          return testing.request ()
            .post ('/authors')
            .send ({author})
            .expect (400, { errors:
                [ { code: 'already_exists',
                  detail: 'The resource you are creating already exists.',
                  status: '400' } ] });
        });

    });
  });

  describe ('getAll', function () {
    it ('should get all resources', function () {
      const Author = blueprint.lookup ('model:author');
      const author = {_id: new ObjectId ().toString (), name: 'James H. Hill'};
      const result = {authors: [Object.assign ({}, {__v: 0}, author)]};

      return Author.create (author)
        .then (() => {
          return testing.request ()
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
          return testing.request ()
            .get (`/authors/${author._id}`)
            .expect (200, result);
        });
    });
  });

  describe ('update', function () {
    it ('should update a single resource', function () {
      const Author = blueprint.lookup ('model:author');
      const author = {_id: new ObjectId ().toString (), name: 'James H. Hill'};

      return Author.create (author)
        .then (() => {
          return testing.request ()
            .put (`/authors/${author._id}`)
            .send ({author: {name: 'John Doe'}})
            .expect (200, {author: Object.assign ({__v: 0}, author, {name: 'John Doe'})});
        });
    });

    it ('should not find resource to update', function () {
      const id = new ObjectId ().toString ();

      return testing.request ()
        .put (`/authors/${id}`)
        .send ({author: {name: 'John Doe'}})
        .expect (404, { errors: [ { code: 'not_found', detail: 'Not found', status: '404' } ] });
    });

    it ('should delete a field on the resource', function () {
      const User = blueprint.lookup ('model:user');
      const user = {_id: new ObjectId ().toString (), first_name: 'John', last_name: 'Doe'};

      return User.create (user)
        .then (() => {
          return testing.request ()
            .put (`/users/${user._id}`)
            .send ({user: {last_name: null}})
            .expect (200, {user: Object.assign ({__v: 0, _id: user._id}, {first_name: 'John', blacklist: []})});
        });

    });
  });

  describe ('delete', function () {
    it ('should delete a single resource', function () {
      const Author = blueprint.lookup ('model:author');
      const author = {_id: new ObjectId ().toString (), name: 'James H. Hill'};

      return Author.create (author)
        .then (() => {
          return testing.request ()
            .delete (`/authors/${author._id}`)
            .expect (200, 'true');
        });
    });
  });
});