const { expect } = require ('chai');
const path = require ('path')
const Application = require ('../../../lib/application');
const messaging   = require ('../../../lib/messaging');

describe ('lib | Application', function () {
  describe ('configure', function () {
    it ('should configure the application', function () {
      const appPath = path.resolve (__dirname, '../../dummy/app');
      let app = new Application ({appPath, messaging: messaging ()});

      return app.configure ()
        .then (app => {
          expect (app).to.have.nested.property ('resources.controllers').to.have.keys (['main','namespace-user','user']);
          expect (app).to.have.nested.property ('resources.listeners').to.have.property ('blueprint\\.app\\.init').to.have.keys (['echo','legacy']);
          expect (app).to.have.nested.property ('resources.policies').to.have.keys (['identity']);
          expect (app).to.have.nested.property ('resources.routers').to.have.keys (['main','users','v1']);
        });
    });
  })
});
