const { expect } = require ('chai');
const path = require ('path')
const Application = require ('../../../lib/application');
const messaging   = require ('../../../lib/messaging');

describe ('lib | Application', function () {

  function makeApplication () {
    const appPath = path.resolve (__dirname, '../../dummy/app');
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
          expect (app).to.have.nested.property ('resources.routers').to.have.keys (['main','users','v1']);
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
});
