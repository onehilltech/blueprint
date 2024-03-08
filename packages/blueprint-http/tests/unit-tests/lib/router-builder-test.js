const chai = require ('chai');
const { expect } = chai;
chai.use (require ('chai-as-promised'))

const request  = require ('supertest');
const express  = require ('express');

const RouterBuilder = require ('../../../src/lib/router-builder');
const HttpError = require ('../../../src/lib/http-error');

const policies = require ('../../../src/lib/policies');
const blueprint = require ('../../../src/lib');

describe ('lib | RouterBuilder', function () {
  describe ('build', function () {
    context ('middleware', function () {
      it ('should build router containing action with single function', async function () {
        const r1 = {
          '/r1': {
            get: {action: 'main@getFunction'},
          }
        };

        let builder = new RouterBuilder (blueprint.app);
        builder.addSpecification (r1);

        const app = express ();
        app.use (await builder.build ());

        return request (app)
          .get ('/r1')
          .expect (200, {result: 'getFunction'});
      });

      it ('should build router containing action with function array', async function () {
        const r1 = {
          '/r1': {
            get: {action: 'main@getFunctionArray'},
          }
        };

        const builder = new RouterBuilder (blueprint.app);
        const router = await builder.addSpecification (r1).build ();

        const app = express ();
        app.use (router);

        return request (app)
          .get ('/r1')
          .expect (200, {result: 'getFunctionArray'});
      });

      it ('should build router with sub-routes', async function () {
        const r1 = {
          '/s1': {
            '/r1': {
              get: {action: 'main@getFunctionArray'},
            }
          }
        };

        const builder = new RouterBuilder (blueprint.app);
        const router = await builder.addSpecification (r1).build ();

        const app = express ();
        app.use (router);

        return request (app)
          .get ('/s1/r1')
          .expect (200, {result: 'getFunctionArray'});
      });
    });

    context ('validation', function () {
      it ('should build router containing controller action with schema', async function () {
        const r1 = {
          '/r1': {
            get: {action: 'main@getActionWithSchema'},
          }
        };

        const builder = new RouterBuilder (blueprint.app);
        const router = await builder.addSpecification (r1).build ();
        const app = express ();

        app.use (router);

        return request (app)
          .get ('/r1')
          .expect (200, {result: 'getActionWithSchema'});
      });

      it ('should build router containing controller action with validate', async function () {
        const r1 = {
          '/r1': {
            get: {action: 'main@getActionWithValidate'},
          }
        };

        const builder = new RouterBuilder (blueprint.app);
        const router = await builder.addSpecification (r1).build ();

        let app = express ();
        app.use (router);

        return request (app)
          .get ('/r1')
          .expect (200, {result: 'getActionWithValidate'});
      });

      it ('should build router that fails its validation phase', async function () {
        const r1 = {
          '/r1': {
            post: {action: 'main@postActionWithValidateFail'},
          }
        };

        const builder = new RouterBuilder (blueprint.app);
        const router = await builder.addSpecification (r1).build ();
        const app = express ();

        app.use (router);

        app.use ((err, req, res, next) => {
          expect (err).to.be.instanceof (HttpError);
          expect (err.message).to.equal ('The request validation failed.');
          expect (err.code).to.equal ('validation_failed');

          res.status (400).json ({error: err.message});
        });

        return request (app)
          .post ('/r1')
          .expect (400, {error: 'The request validation failed.'});
      });
    });

    context ('policies', function () {
      it ('should build router with successful policy', async function () {
        const r1 = {
          '/r1': {
            policy: policies.check ('identity', true),
            get: {action: 'main@getActionWithValidate'},
          }
        };

        const builder = new RouterBuilder (blueprint.app);
        const router = await builder.addSpecification (r1).build ();
        const app = express ();
        app.use (router);

        return request (app)
          .get ('/r1')
          .expect (200, {result: 'getActionWithValidate'});
      });

      it ('should build router with optional policy', async function () {
        const r1 = {
          '/r1': {
            policy: policies.check ('?optional'),
            get: {action: 'main@getActionWithValidate'},
          }
        };

        const builder = new RouterBuilder (blueprint.app);
        const router = await builder.addSpecification (r1).build ();
        const app = express ();
        app.use (router);

        return request (app)
          .get ('/r1')
          .expect (200, {result: 'getActionWithValidate'});
      });

      it ('should not build router with missing policy', function () {
        async function bad () {
          const r1 = {
            '/r1': {
              policy: policies.check ('missing'),
              get: {action: 'main@getActionWithValidate'},
            }
          };

          const builder = new RouterBuilder (blueprint.app);
          await builder.addSpecification (r1).build ();
        }

        expect (bad ()).to.be.rejectedWith (Error);
      });
    });

    context ('resource', function () {
      it ('should build router with resource', async function () {

        const users = {
          '/users': {
            resource: {
              controller: 'user'
            }
          }
        };

        const builder = new RouterBuilder (blueprint.app);
        const router = await builder.addSpecification (users).build ();
        const app = express ();
        app.use (router);

        let requests = [
          request (app).post ('/users').expect (200, {method: 'create'}),
          request (app).get ('/users').expect (200, {method: 'getAll'}),
          request (app).get ('/users/1').expect (200, {method: 'getOne', id: '1'}),
          request (app).put ('/users/1').expect (200, {method: 'update', id: '1'}),
          request (app).delete ('/users/1').expect (200, {method: 'delete', id: '1'})
        ];

        return Promise.all (requests);
      });

      it ('should allow a subset of actions', async function () {
        const users = {
          '/users': {
            resource: {
              controller: 'user',
              allow: ['getOne']
            }
          }
        };

        let builder = new RouterBuilder (blueprint.app);
        let router = await builder.addSpecification (users).build ();
        let app = express ();

        app.use (router);

        let requests = [
          request (app).post ('/users').expect (404),
          request (app).get ('/users/1').expect (200, {method: 'getOne', id: '1'})
        ];

        return Promise.all (requests);
      });

      it ('should deny a subset of actions', async function () {
        const users = {
          '/users': {
            resource: {
              controller: 'user',
              deny: ['getOne']
            }
          }
        };

        let builder = new RouterBuilder (blueprint.app);
        let router = await builder.addSpecification (users).build ();

        let app = express ();
        app.use (router);

        let requests = [
          request (app).post ('/users').expect (200, {method: 'create'}),
          request (app).get ('/users/1').expect (404)
        ];

        return Promise.all (requests);
      });

      it ('should build router with resource and policy', async function () {
        const users = {
          '/users': {
            resource: {
              controller: 'user'
            }
          }
        };

        const builder = new RouterBuilder (blueprint.app);
        const router = await builder.addSpecification (users).build ();

        let app = express ();
        app.use (router);

        let called = false;

        blueprint.once ('user.create', (value) => {
          called = value;
        });

        return request (app)
          .post ('/users')
          .expect (200, { method: 'create' }).then (() => {
            expect (called).to.be.true;
          });
      });

      it ('should build router with namespace resource and policy', async function () {
        const users = {
          '/users': {
            resource: {
              controller: 'namespace-user'
            }
          }
        };

        const builder = new RouterBuilder (blueprint.app);
        const router = await builder.addSpecification (users).build ();

        let called = false;

        const app = express ();
        app.use (router);

        blueprint.once ('test.user.create', (value) => {
          called = value;
        });

        return request (app)
          .post ('/users')
          .expect (200, { method: 'create' })
          .then (() => {
            expect (called).to.be.true;
          });
      });
    });
  });
})
