const {expect} = require ('chai');
const request  = require ('supertest');
const express  = require ('express');
const {check} = require ('express-validator/check');
const {parallel} = require ('async');

const RouterBuilder = require ('../../../lib/router-builder');
const Controller = require ('../../../lib/controller');
const Action = require ('../../../lib/action');
const HttpError = require ('../../../lib/http-error');
const Policy = require ('../../../lib/policy');
const ResourceController = require ('../../../lib/resource-controller');
const assert = require ('assert');

const MainController = Controller.extend ({
  getFunction () {
    return function (req, res, next) {
      res.status (200).json ({result: 'getFunction'});
      next ();
    };
  },

  getFunctionArray () {
    return [
      (req, res, next) => { next () },
      (req, res, next) => {
        res.status (200).json ({result: 'getFunctionArray'});
        next ();
      }
    ]
  },

  getLegacyObjectWithValidateFunction () {
    return {
      validate (req, callback) { callback (null); },
      sanitize (req, callback) { callback (null); },
      execute (req, res, next) {
        res.status (200).json ({result: 'getLegacyObjectWithValidateFunction'});
        next ();
      }
    }
  },

  getLegacyObjectWithValidateSchema () {
    return {
      validate: {},
      execute (req, res, next) {
        res.status (200).json ({result: 'getLegacyObjectWithValidateSchema'});
        next ();
      }
    }
  },

  getActionWithSchema () {
    return Action.extend ({
      schema: {
        id: {
          // The location of the field, can be one or more of body, cookies, headers, params or query.
          // If omitted, all request locations will be checked
          in: ['params', 'query'],
          errorMessage: 'ID is wrong',
          optional: true,
          isInt: true,
          // Sanitizers can go here as well
          toInt: true
        },
      },

      execute (req, res, next) {
        res.status (200).json ({result: 'getActionWithSchema'});
        next ();
      }
    });
  },

  getActionWithValidate () {
    return Action.extend ({
      validate: [
        check ('username')
          .isEmail().withMessage('must be an email')
          .optional ()
          .trim()
          .normalizeEmail()
      ],

      execute (req, res, next) {
        res.status (200).json ({result: 'getActionWithValidate'});
        next ();
      }
    });
  },

  postActionWithValidateFail ( ) {
    return Action.extend ({
      validate: [
        check ('username')
          .isEmail ().withMessage('The username must be an email')
          .trim()
          .normalizeEmail()
      ],

      execute (req, res, next) {
        res.status (200).json ({result: 'postActionWithValidateFail'});
        next ();
      }
    });
  }
});

function simpleHandler (method) {
  return (req, res, next) => {
    res.status (200).json ({method});
    next ();
  }
}

function singleEntityHandler (method, param) {
  return (req, res, next) => {
    res.status (200).json ({method, id: req.params[param]});
    next ();
  }
}
const UserController = ResourceController.extend ({
  name: 'user',

  create () { return simpleHandler ('create'); },
  getAll () { return simpleHandler ('getAll'); },
  getOne () { return singleEntityHandler ('getOne', 'userId') },
  update () { return singleEntityHandler ('update', 'userId') },
  delete () { return singleEntityHandler ('delete', 'userId') },
  count () { return simpleHandler ('count'); }
});


describe ('lib | RouterBuilder', function () {
  describe ('build', function () {
    context ('deprecated', function () {
      it ('should build router containing legacy object with validate function', function (done) {
        const r1 = {
          '/r1': {
            get: {action: 'MainController@getLegacyObjectWithValidateFunction'},
          }
        };

        let builder = new RouterBuilder ({
          listeners: {},
          routers: { r1 },
          controllers: {
            MainController: new MainController ()
          },
          policies: {}
        });

        builder.build ().then (router => {
          let app = express ();
          app.use (router);

          request (app)
            .get ('/r1')
            .expect (200, {result: 'getLegacyObjectWithValidateFunction'}, done);
        }).catch (done);
      });

      it ('should build router containing legacy object with validate schema', function (done) {
        const r1 = {
          '/r1': {
            get: {action: 'MainController@getLegacyObjectWithValidateSchema'},
          }
        };

        let builder = new RouterBuilder ({
          listeners: {},
          routers: { r1 },
          controllers: {
            MainController: new MainController ()
          },
          policies: {}
        });

        builder.build ().then (router => {
          let app = express ();
          app.use (router);

          request (app)
            .get ('/r1')
            .expect (200, {result: 'getLegacyObjectWithValidateSchema'}, done);
        }).catch (done);
      });
    });

    context ('middleware', function () {
      it ('should build router containing action with single function', function (done) {
        const r1 = {
          '/r1': {
            get: {action: 'MainController@getFunction'},
          }
        };

        let builder = new RouterBuilder ({
          listeners: {},
          routers: { r1 },
          controllers: {
            MainController: new MainController ()
          },
          policies: {}
        });

        builder.build ().then (router => {
          let app = express ();
          app.use (router);

          request (app)
            .get ('/r1')
            .expect (200, {result: 'getFunction'}, done);
        }).catch (done);
      });

      it ('should build router containing action with function array', function (done) {
        const r1 = {
          '/r1': {
            get: {action: 'MainController@getFunctionArray'},
          }
        };

        let builder = new RouterBuilder ({
          listeners: {},
          routers: { r1 },
          controllers: {
            MainController: new MainController ()
          },
          policies: {}
        });

        builder.build ().then (router => {
          let app = express ();
          app.use (router);

          request (app)
            .get ('/r1')
            .expect (200, {result: 'getFunctionArray'}, done);
        }).catch (done);
      });

      it ('should build router with sub-routes', function (done) {
        const r1 = {
          '/s1': {
            '/r1': {
              get: {action: 'MainController@getFunctionArray'},
            }
          }
        };

        let builder = new RouterBuilder ({
          listeners: {},
          routers: { r1 },
          controllers: {
            MainController: new MainController ()
          },
          policies: {}
        });

        builder.build ().then (router => {
          let app = express ();
          app.use (router);

          request (app)
            .get ('/s1/r1')
            .expect (200, {result: 'getFunctionArray'}, done);
        }).catch (done);

      });
    });

    context ('validation', function () {
      it ('should build router containing controller action with schema', function (done) {
        const r1 = {
          '/r1': {
            get: {action: 'MainController@getActionWithSchema'},
          }
        };

        let builder = new RouterBuilder ({
          listeners: {},
          routers: { r1 },
          controllers: {
            MainController: new MainController ()
          },
          policies: {}
        });

        builder.build ().then (router => {
          let app = express ();
          app.use (router);

          request (app)
            .get ('/r1')
            .expect (200, {result: 'getActionWithSchema'}, done);
        }).catch (done);
      });

      it ('should build router containing controller action with validate', function (done) {
        const r1 = {
          '/r1': {
            get: {action: 'MainController@getActionWithValidate'},
          }
        };

        let builder = new RouterBuilder ({
          listeners: {},
          routers: { r1 },
          controllers: {
            MainController: new MainController ()
          },
          policies: {}
        });

        builder.build ().then (router => {
          let app = express ();
          app.use (router);

          request (app)
            .get ('/r1')
            .expect (200, {result: 'getActionWithValidate'}, done);
        }).catch (done);
      });

      it ('should build router that fails its validation phase', function (done) {
        const r1 = {
          '/r1': {
            post: {action: 'MainController@postActionWithValidateFail'},
          }
        };

        let builder = new RouterBuilder ({
          listeners: {},
          routers: { r1 },
          controllers: {
            MainController: new MainController ()
          },
          policies: {}
        });

        builder.build ().then (router => {
          let app = express ();
          app.use (router);
          app.use ((err, req, res, next) => {
            expect (err).to.be.instanceof (HttpError);
            expect (err.message).to.equal ('Request validation failed.');
            expect (err.code).to.equal ('validation_failed');

            res.status (400).json ({error: err.message});
          });

          request (app)
            .post ('/r1')
            .expect (400, {error: 'Request validation failed.'}, done);
        }).catch (done);
      });
    });

    context ('policies', function () {
      it ('should build router with successful policy', function (done) {
        const r1 = {
          '/r1': {
            policy: 'success',
            get: {action: 'MainController@getActionWithValidate'},
          }
        };

        let builder = new RouterBuilder ({
          listeners: {},
          routers: { r1 },
          controllers: {
            MainController: new MainController ()
          },
          policies: {
            success: Policy.extend ({
              runCheck () {
                return Promise.resolve (true);
              }
            })
          }
        });

        builder.build ().then (router => {
          let app = express ();
          app.use (router);

          request (app)
            .get ('/r1')
            .expect (200, {result: 'getActionWithValidate'}, done);
        }).catch (done);
      });

      it ('should build router with optional policy', function (done) {
        const r1 = {
          '/r1': {
            policy: '?optional',
            get: {action: 'MainController@getActionWithValidate'},
          }
        };

        let builder = new RouterBuilder ({
          listeners: {},
          routers: { r1 },
          controllers: {
            MainController: new MainController ()
          },
          policies: { }
        });

        builder.build ().then (router => {
          let app = express ();
          app.use (router);

          request (app)
            .get ('/r1')
            .expect (200, {result: 'getActionWithValidate'}, done);
        }).catch (done);
      });

      it ('should build router with missing policy', function (done) {
        const r1 = {
          '/r1': {
            policy: 'missing',
            get: {action: 'MainController@getActionWithValidate'},
          }
        };

        let builder = new RouterBuilder ({
          listeners: {},
          routers: { r1 },
          controllers: {
            MainController: new MainController ()
          },
          policies: { }
        });

        builder.build ().then (router => {}).catch (err => {
          expect (err).to.be.instanceof (assert.AssertionError);
          done ();
        });
      });
    });

    context ('resource', function () {
      it ('should build router with resource', function (done) {

        const users = {
          '/users': {
            resource: {
              controller: 'UserController'
            }
          }
        };

        let builder = new RouterBuilder ({
          listeners: {},
          routers: { users },
          controllers: {
            UserController: new UserController ()
          },
          policies: {}
        });

        builder.build ().then (router => {
          let app = express ();
          app.use (router);

          parallel ([
            (callback) => { request (app).post ('/users').expect (200, {method: 'create'}, callback); },
            (callback) => { request (app).get ('/users').expect (200, {method: 'getAll'}, callback); },
            (callback) => { request (app).get ('/users/1').expect (200, {method: 'getOne', id: 1}, callback); },
            (callback) => { request (app).put ('/users/1').expect (200, {method: 'update', id: 1}, callback); },
            (callback) => { request (app).delete ('/users/1').expect (200, {method: 'delete', id: 1}, callback); },
          ], done);
        }).catch (done);
      });

      it ('should allow a subset of actions', function (done) {

        const users = {
          '/users': {
            resource: {
              controller: 'UserController',
              allow: ['getOne']
            }
          }
        };

        let builder = new RouterBuilder ({
          listeners: {},
          routers: { users },
          controllers: {
            UserController: new UserController ()
          },
          policies: {}
        });

        builder.build ().then (router => {
          let app = express ();
          app.use (router);

          parallel ([
            (callback) => { request (app).post ('/users').expect (404, callback); },
            (callback) => { request (app).get ('/users/1').expect (200, {method: 'getOne', id: 1}, callback); },
          ], done);
        }).catch (done);
      });

      it ('should deny a subset of actions', function (done) {

        const users = {
          '/users': {
            resource: {
              controller: 'UserController',
              deny: ['getOne']
            }
          }
        };

        let builder = new RouterBuilder ({
          listeners: {},
          routers: { users },
          controllers: {
            UserController: new UserController ()
          },
          policies: {}
        });

        builder.build ().then (router => {
          let app = express ();
          app.use (router);

          parallel ([
            (callback) => { request (app).post ('/users').expect (200, {method: 'create'}, callback); },
            (callback) => { request (app).get ('/users/1').expect (404, callback); },
          ], done);
        }).catch (done);
      });

      it ('should build router with resource and policy', function (done) {

        const users = {
          '/users': {
            resource: {
              controller: 'UserController'
            }
          }
        };

        let builder = new RouterBuilder ({
          listeners: {},
          routers: { users },
          controllers: {
            UserController: new UserController ()
          },
          policies: {
            user: {
              create: Policy.extend ({
                failureCode: 'create_failed',
                failureMessage: 'The create policy failed.',

                runCheck () {
                  return Promise.resolve (false);
                }
              })
            }
          }
        });

        builder.build ().then (router => {
          let app = express ();
          app.use (router);
          app.use ((err, req, res, next) => {
            expect (err).to.be.instanceof (HttpError);
            res.status (403).json ({code: err.code, message: err.message});
          });

          parallel ([
            (callback) => { request (app).post ('/users').expect (403, {code: 'create_failed', message: 'The create policy failed.'}, callback); },
          ], done);
        }).catch (done);
      });

      it ('should build router with namespace resource and policy', function (done) {
        const NamespaceUserController = UserController.extend ({
          namespace: 'test'
        });

        const users = {
          '/users': {
            resource: {
              controller: 'NamespaceUserController'
            }
          }
        };

        let builder = new RouterBuilder ({
          listeners: {},
          routers: { users },
          controllers: {
            NamespaceUserController: new NamespaceUserController ()
          },
          policies: {
            test: {
              user: {
                create: Policy.extend ({
                  failureCode: 'create_failed',
                  failureMessage: 'The create policy failed.',

                  runCheck () {
                    return Promise.resolve (false);
                  }
                })
              }
            }
          }
        });

        builder.build ().then (router => {
          let app = express ();
          app.use (router);
          app.use ((err, req, res, next) => {
            expect (err).to.be.instanceof (HttpError);
            res.status (403).json ({code: err.code, message: err.message});
          });

          parallel ([
            (callback) => { request (app).post ('/users').expect (403, {code: 'create_failed', message: 'The create policy failed.'}, callback); },
          ], done);
        }).catch (done);
      });

    });
  });
});
