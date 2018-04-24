const {expect} = require ('chai');
const request  = require ('supertest');
const express  = require ('express');
const {check} = require ('express-validator/check');

const RouterBuilder = require ('../../../lib/router-builder');
const Controller = require ('../../../lib/controller');
const Action = require ('../../../lib/action');
const HttpError = require ('../../../lib/http-error');
const Policy = require ('../../../lib/policy');
const ResourceController = require ('../../../lib/resource-controller');

const policies = require ('../../../lib/policies');

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
      it ('should build router containing legacy object with validate function', function () {
        const r1 = {
          '/r1': {
            get: {action: 'MainController@getLegacyObjectWithValidateFunction'},
          }
        };

        let builder = new RouterBuilder ({
          controllers: {
            MainController: new MainController ()
          },
          policies: {}
        });

        let router = builder.addSpecification (r1).build ();
        let app = express ();

        app.use (router);

        return request (app)
          .get ('/r1')
          .expect (200, {result: 'getLegacyObjectWithValidateFunction'});
      });

      it ('should build router containing legacy object with validate schema', function () {
        const r1 = {
          '/r1': {
            get: {action: 'MainController@getLegacyObjectWithValidateSchema'},
          }
        };

        let builder = new RouterBuilder ({
          controllers: {
            MainController: new MainController ()
          },
          policies: {}
        });

        const router = builder.addSpecification (r1).build ();
        const app = express ();

        app.use (router);

        return request (app)
          .get ('/r1')
          .expect (200, {result: 'getLegacyObjectWithValidateSchema'});
      });
    });

    context ('middleware', function () {
      it ('should build router containing action with single function', function () {
        const r1 = {
          '/r1': {
            get: {action: 'MainController@getFunction'},
          }
        };

        let builder = new RouterBuilder ({
          controllers: {
            MainController: new MainController ()
          },
          policies: {}
        });

        const router = builder.addSpecification (r1).build ();
        const app = express ();

        app.use (router);

        return request (app)
          .get ('/r1')
          .expect (200, {result: 'getFunction'});
      });

      it ('should build router containing action with function array', function () {
        const r1 = {
          '/r1': {
            get: {action: 'MainController@getFunctionArray'},
          }
        };

        let builder = new RouterBuilder ({
          controllers: {
            MainController: new MainController ()
          },
          policies: {}
        });

        const router = builder.addSpecification (r1).build ();
        const app = express ();

        app.use (router);

        return request (app)
          .get ('/r1')
          .expect (200, {result: 'getFunctionArray'});
      });

      it ('should build router with sub-routes', function () {
        const r1 = {
          '/s1': {
            '/r1': {
              get: {action: 'MainController@getFunctionArray'},
            }
          }
        };

        let builder = new RouterBuilder ({
          controllers: {
            MainController: new MainController ()
          },
          policies: {}
        });

        const router = builder.addSpecification (r1).build ();
        const app = express ();

        app.use (router);

        return request (app)
          .get ('/s1/r1')
          .expect (200, {result: 'getFunctionArray'});
      });
    });

    context ('validation', function () {
      it ('should build router containing controller action with schema', function () {
        const r1 = {
          '/r1': {
            get: {action: 'MainController@getActionWithSchema'},
          }
        };

        let builder = new RouterBuilder ({
          controllers: {
            MainController: new MainController ()
          },
          policies: {}
        });

        const router = builder.addSpecification (r1).build ();
        const app = express ();

        app.use (router);

        return request (app)
          .get ('/r1')
          .expect (200, {result: 'getActionWithSchema'});
      });

      it ('should build router containing controller action with validate', function () {
        const r1 = {
          '/r1': {
            get: {action: 'MainController@getActionWithValidate'},
          }
        };

        let builder = new RouterBuilder ({
          controllers: {
            MainController: new MainController ()
          },
          policies: {}
        });

        const router = builder.addSpecification (r1).build ();

        let app = express ();
        app.use (router);

        return request (app)
          .get ('/r1')
          .expect (200, {result: 'getActionWithValidate'});
      });

      it ('should build router that fails its validation phase', function () {
        const r1 = {
          '/r1': {
            post: {action: 'MainController@postActionWithValidateFail'},
          }
        };

        let builder = new RouterBuilder ({
          controllers: {
            MainController: new MainController ()
          },
          policies: {}
        });

        const router = builder.addSpecification (r1).build ();
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
      it ('should build router with successful policy', function () {
        const r1 = {
          '/r1': {
            policy: policies.check ('identity', true),
            get: {action: 'MainController@getActionWithValidate'},
          }
        };

        let builder = new RouterBuilder ({
          controllers: {
            MainController: new MainController ()
          },
          policies: {
            identity : Policy.extend ({
              setParameters (value) {
                this.value = value;
              },

              runCheck () { return this.value; }
            })
          }
      });

        const router = builder.addSpecification (r1).build ();
        const app = express ();

        app.use (router);

        return request (app)
          .get ('/r1')
          .expect (200, {result: 'getActionWithValidate'});
      });

      it ('should build router with optional policy', function () {
        const r1 = {
          '/r1': {
            policy: policies.check ('?optional'),
            get: {action: 'MainController@getActionWithValidate'},
          }
        };

        let builder = new RouterBuilder ({
          controllers: {
            MainController: new MainController ()
          },
          policies: { }
        });

        let router = builder.addSpecification (r1).build ();
        let app = express ();

        app.use (router);

        return request (app)
          .get ('/r1')
          .expect (200, {result: 'getActionWithValidate'});
      });

      it ('should not build router with missing policy', function () {
        expect (() => {
          const r1 = {
            '/r1': {
              policy: policies.check ('missing'),
              get: {action: 'MainController@getActionWithValidate'},
            }
          };

          let builder = new RouterBuilder ({
            controllers: {
              MainController: new MainController ()
            },
            policies: { }
          });

          builder.addSpecification (r1).build ();
        }).to.throw ('We could not locate the policy missing.');
      });
    });

    context ('resource', function () {
      it ('should build router with resource', function () {

        const users = {
          '/users': {
            resource: {
              controller: 'UserController'
            }
          }
        };

        let builder = new RouterBuilder ({
          controllers: {
            UserController: new UserController ()
          },
          policies: {}
        });

        let router = builder.addSpecification (users).build ();

        let app = express ();
        app.use (router);

        let requests = [
          request (app).post ('/users').expect (200, {method: 'create'}),
          request (app).get ('/users').expect (200, {method: 'getAll'}),
          request (app).get ('/users/1').expect (200, {method: 'getOne', id: 1}),
          request (app).put ('/users/1').expect (200, {method: 'update', id: 1}),
          request (app).delete ('/users/1').expect (200, {method: 'delete', id: 1})
        ];

        return Promise.all (requests);
      });

      it ('should allow a subset of actions', function () {
        const users = {
          '/users': {
            resource: {
              controller: 'UserController',
              allow: ['getOne']
            }
          }
        };

        let builder = new RouterBuilder ({
          controllers: {
            UserController: new UserController ()
          },
          policies: {}
        });

        let router = builder.addSpecification (users).build ();
        let app = express ();

        app.use (router);

        let requests = [
          request (app).post ('/users').expect (404),
          request (app).get ('/users/1').expect (200, {method: 'getOne', id: 1})
        ];

        return Promise.all (requests);
      });

      it ('should deny a subset of actions', function () {

        const users = {
          '/users': {
            resource: {
              controller: 'UserController',
              deny: ['getOne']
            }
          }
        };

        let builder = new RouterBuilder ({
          controllers: {
            UserController: new UserController ()
          },
          policies: {}
        });

        let router = builder.addSpecification (users).build ();

        let app = express ();
        app.use (router);

        let requests = [
          request (app).post ('/users').expect (200, {method: 'create'}),
          request (app).get ('/users/1').expect (404)
        ];

        return Promise.all (requests);
      });

      it ('should build router with resource and policy', function () {
        const users = {
          '/users': {
            resource: {
              controller: 'user'
            }
          }
        };

        let builder = new RouterBuilder ({
          controllers: {
            user: new UserController ()
          },
          policies: {
            user: {
              create: Policy.extend ({
                failureCode: 'create_failed',
                failureMessage: 'The create policy failed.',

                runCheck () {
                  return false;
                }
              })
            }
          }
        });

        let router = builder.addSpecification (users).build ();
        let app = express ();

        app.use (router);
        app.use ((err, req, res, next) => {
          expect (err).to.be.instanceof (HttpError);
          res.status (403).json ({code: err.code, message: err.message});
        });

        return request (app)
          .post ('/users')
          .expect (403, {code: 'create_failed', message: 'The create policy failed.'});
      });

      it ('should build router with namespace resource and policy', function () {
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
                    return false;
                  }
                })
              }
            }
          }
        });

        let router = builder.addSpecification (users).build ();

        let app = express ();

        app.use (router);

        app.use ((err, req, res, next) => {
          expect (err).to.be.instanceof (HttpError);
          res.status (403).json ({code: err.code, message: err.message});
        });

        return request (app)
          .post ('/users')
          .expect (403, {code: 'create_failed', message: 'The create policy failed.'});
      });
    });
  });
});
