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

    context ('validation', function () {
      it ('should fail because of missing required parameters', function () {
        return testing.request ()
          .post ('/authors')
          .send ({author: {}})
          .expect (400, {
            errors: [{
              status: '400',
              code: 'validation_failed',
              detail: 'The request validation failed.',
              meta: {
                validation: {
                  'author.name': {
                    location: 'body',
                    msg: 'This field is required.',
                    param: 'author.name'
                  }
                }
              }
            }]
          });
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

    it ('should populate the results', function () {
      const Author = blueprint.lookup ('model:author');
      const User = blueprint.lookup ('model:user');

      const author = {_id: new ObjectId ().toString (), name: 'James H. Hill'};

      return Author.create (author)
        .then (author => {
          return User.create ({first_name: 'John', last_name: 'Doe', favorite_author: author._id})
            .then (user => testing.request ()
              .get (`/users/${user.id}?_populate=true`)
              .expect (200, {
                authors:
                  [
                    {__v: 0, _id: author.id, name: 'James H. Hill'}
                  ],
                users:
                  [
                    {__v: 0, _id: user.id, first_name: 'John', last_name: 'Doe', favorite_author: author.id, blacklist: []}
                  ]
              }));
        });
    });

    it ('should not find the resource', function () {
      const id = new ObjectId ().toString ();

      return testing.request ()
        .get (`/authors/${id}`)
        .query ({populate: true})
        .expect (404, { errors: [ { code: 'not_found', detail: 'Not found', status: '404' } ] });
    });

    it ('should return bad request because of bad id', function () {
      return testing.request ()
        .get ('/authors/12')
        .expect (400, {errors: [
          {
            code: 'validation_failed',
            detail: 'The request validation failed.',
            status: '400',
            meta: {
              validation: {
                authorId: {
                  location: 'params',
                  msg: 'The id is not valid.',
                  param: 'authorId',
                  value: '12'
                }
              }
            }
          }]});
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

  describe ('count', function () {
    it ('should count the number of resources', function () {
      const Author = blueprint.lookup ('model:author');
      const authors =
        [
          {_id: new ObjectId (), name: 'Jack Doe'},
          {_id: new ObjectId (), name: 'John Doe'}
        ];

      return Author.create (authors)
        .then (() => {
          return testing.request ()
            .get ('/authors/count')
            .expect (200, {count: 2});
        });
    });
  });
});