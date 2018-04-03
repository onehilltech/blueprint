const { expect } = require ('chai');
const path = require ('path')
const Application = require ('../../../lib/application');
const messaging   = require ('../../../lib/messaging');

const express = require ('express');
const request = require ('supertest');

describe ('lib | Application', function () {

  function makeApplication () {
    const appPath = path.resolve ('./tests/dummy/app');
    return new Application ({appPath, messaging: messaging ()});
  }

  describe ('configure', function () {
    it ('should configure the application', function () {
      let app = makeApplication ();

      return app.configure ()
        .then (app => {
          expect (app).to.have.nested.property ('resources.controllers').to.have.keys (['main','namespace-user','user']);
          expect (app).to.have.nested.property ('resources.listeners').to.have.property ('blueprint\\.app\\.init').to.have.keys (['echo','legacy']);
          expect (app).to.have.nested.property ('resources.policies').to.have.keys (['identity']);
          expect (app).to.have.nested.property ('resources.routers').to.have.keys (['main','users','inner']);
        });
    });
  });

  describe ('lookup', function () {
    it ('should lookup a loaded component', function () {
      let app = makeApplication ();

      return app.configure ()
        .then (app => {
          let mainController = app.lookup ('controller:main');

          expect (mainController).to.equal (app.resources.controllers.main);
        })
    });

    it ('should lookup a loaded configuration', function () {
      let app = makeApplication ();

      return app.configure ()
        .then (app => {
          let appConfig = app.lookup ('config:app');

          expect (appConfig).to.equal (app.configs.app);
        })
    });
  });

  describe ('mount', function () {
    it ('should mount a router', function () {
      let app = makeApplication ();

      return app.configure ()
        .then (app => {
          const router = app.mount ('main');
          const server = express ();

          server.use (router);

          return request (server).get ('/main').expect (200, "true");
        });
    });

    it ('should mount an inner router', function () {
      let app = makeApplication ();

      return app.configure ()
        .then (app => {
          const router = app.mount ('inner.main');
          const server = express ();

          server.use (router);

          return request (server).get ('/main').expect (200, "true");
        });
    });
  });
});
