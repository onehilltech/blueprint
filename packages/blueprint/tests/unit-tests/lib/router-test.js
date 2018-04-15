const request    = require ('supertest');
const express    = require ('express');
const Router     = require ('../../../lib/router');
const Controller = require ('../../../lib/controller');

const MainController = Controller.extend ({
  getFunction () {
    return function (req, res, next) {
      res.status (200).json ({result: 'getFunction'});
      next ();
    };
  }
});

describe ('lib | Router', function () {
  describe ('build', function () {
    it ('should build router containing action with single function', function () {
      const r1 = {
        '/r1': {
          get: {action: 'MainController@getFunction'},
        }
      };

      const controllers = {
        MainController: new MainController ()
      };

      const policies = {};
      const router = new Router ({specification: r1}).build ({controllers, policies});


      let app = express ();
      app.use (router);

      return request (app)
        .get ('/r1')
        .expect (200, {result: 'getFunction'});
    });
  });
});
