/*
 * Copyright (c) 2018 One Hill Technologies, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const {expect}  = require ('chai');
const blueprint = require ('@onehilltech/blueprint');
const {request} = require ('@onehilltech/blueprint-testing');

const { seed, lean } = require ('../../../lib');

const {
  Types: { ObjectId }
} = require ('mongoose');

const { omit } = require ('lodash');

describe.only ('lib | ResourceController', function () {
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

      return request ()
        .post ('/authors')
        .send ({author})
        .expect (200, {author: Object.assign ({}, {__v: 0}, author)});
    });

    it ('should call each subclass method', function () {
      const author = {_id: new ObjectId ().toString (), name: 'James H. Hill'};

      return request ()
        .post ('/callbacks')
        .send ({author})
        .expect (200)
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
      const {authors} = seed ('$default');
      const author = authors[0];

      return request ()
        .post ('/authors')
        .send ({author})
        .expect (400, { errors:
            [ { code: 'already_exists',
              detail: 'The resource you are creating already exists.',
              status: '400' } ] });
    });

    context ('validation', function () {
      it ('should fail because of missing required parameters', function () {
        return request ()
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
      const {authors} = seed ('$default');

      return request ()
        .get ('/authors')
        .query ({_: {sort: {name: 1}}})
        .expect (200, {authors: lean (authors)});
    });
  });

  describe ('getOne', function () {
    it ('should get one single resource', function () {
      let {authors} = seed ('$default');
      let author = authors[0];

      return request ()
        .get (`/authors/${author.id}`)
        .expect (200, {author: author.lean ()});
    });

    it ('should populate the results', function () {
      const {users,authors} = seed ('$default');

      return request ()
        .get (`/users/${users[0].id}`)
        .query ({_: {populate: true}})
        .expect (200)
        .then (res => {
          expect (res.body).to.have.keys (['authors', 'users']);
          expect (res.body.users).to.eql ([users[0].lean ()]);
          expect (res.body.authors).to.have.deep.members ([authors[1].lean (), authors[0].lean ()]);
        });
    });

    it ('should not find the resource', function () {
      const id = new ObjectId ().toString ();

      return request ()
        .get (`/authors/${id}`)
        .expect (404, { errors: [ { code: 'not_found', detail: 'Not found', status: '404' } ] });
    });

    it ('should return bad request because of bad id', function () {
      return request ()
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
      const {authors} = seed ('$default');
      const author = authors[0];
      const update = {name: 'Adam Douglas'};

      return request ()
        .put (`/authors/${author.id}`)
        .send ({author: update})
        .expect (200, {author: Object.assign (author.lean (), update)});
    });

    it ('should not find resource to update', function () {
      const id = new ObjectId ().toString ();

      return request ()
        .put (`/authors/${id}`)
        .send ({author: {name: 'John Doe'}})
        .expect (404, { errors: [ { code: 'not_found', detail: 'Not found', status: '404' } ] });
    });

    it ('should delete a field on the resource', function () {
      const {users} = seed ('$default');
      const user = users[0];

      return request ()
        .put (`/users/${user.id}`)
        .send ({user: {last_name: null}})
        .expect (200, {user: omit (user.lean (), 'last_name')});
    });

    it ('should not update a deleted resource', function () {
      const {books: [,,,deleted]} = seed ('$default');
      const update = {name: 'Adam Douglas'};

      return request ()
        .delete (`/books/${deleted.id}`)
        .expect (200, 'true')
        .then (() => {
          return request ()
            .put (`/authors/${deleted.id}`)
            .send ({author: update})
            .expect (404);
        });
    });
  });

  describe ('delete', function () {
    it ('should delete a single resource', function () {
      const {authors: [author]} = seed ('$default');

      return request ()
        .delete (`/authors/${author.id}`)
        .expect (200, 'true');
    });

    context ('soft delete', function () {
      it ('should delete the resource', function () {
        const Book = blueprint.lookup ('model:book');
        const {books: [book]} = seed ('$default');

        return request ()
          .delete (`/books/${book.id}`)
          .expect (200, 'true')
          .then (() => Book.findById (book.id))
          .then (book => {
            expect (book._stat.deleted_at).to.be.a ('date');
          });
      });

      it ('should purge a soft deleted resource', function () {
        const Book = blueprint.lookup ('model:book');
        const {books: [book]} = seed ('$default');

        return request ()
          .delete (`/books/${book.id}`)
          .query ({purge: true})
          .expect (200, 'true')
          .then (() => Book.findById (book.id))
          .then (book => {
            expect (book).to.equal (null);
          });
      });

      it ('should not double delete the resource', function () {
        const {books: [book]} = seed ('$default');

        return request ()
          .delete (`/books/${book.id}`)
          .expect (200, 'true')
          .then (() => request ().delete (`/books/${book.id}`).expect (404));
      });
    });
  });

  describe ('count', function () {
    it ('should count the number of resources', function () {
      return request ()
        .get ('/authors/count')
        .expect (200, {count: 7});
    });
  });
});