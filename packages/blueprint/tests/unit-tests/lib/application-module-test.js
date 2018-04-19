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

const path = require ('path');

const {
  expect
} = require ('chai');

const ApplicationModule = require ('../../../lib/application-module');
const blueprint = require ('../../../lib');

describe ('lib | ApplicationModule', function () {
  describe ('constructor', function () {
    it ('should create a new ApplicationModule', function () {
      let app = blueprint.app;
      let appModule = new ApplicationModule ({modulePath: app.appPath, app});

      expect (appModule).to.deep.include ({modulePath: app.appPath});
    });
  });

  describe ('configure', function () {
    it ('should load an application module into memory', function () {
      let app = blueprint.app;
      let appModule = new ApplicationModule ({app, modulePath: app.appPath});

      return appModule.configure ().then (result => {
        expect (appModule).to.equal (result);

        expect (result.resources).to.have.nested.property ('controllers.main');
        expect (result.resources).to.have.nested.property ('controllers.namespace-user');
        expect (result.resources).to.have.nested.property ('controllers.user');

        expect (result.resources).to.have.nested.property ('listeners.blueprint\\.app\\.init');

        expect (result.resources).to.have.nested.property ('models.person');

        expect (result.resources).to.have.nested.property ('policies.identity');

        expect (result.resources).to.have.nested.property ('services.cart');
        expect (result.resources).to.have.nested.property ('services.shopping-cart');

        expect (result.resources).to.have.nested.property ('routers.main');
        expect (result.resources).to.have.nested.property ('routers.users');
        expect (result.resources).to.have.nested.property ('routers.inner.main');
      });
    });
  });

  describe ('viewsPath', function () {
    it ('should get the viewPaths property', function () {
      let app = blueprint.app;
      let appModule = new ApplicationModule ({app, modulePath: app.appPath});

      expect (appModule.viewsPath).to.equal (path.join (app.appPath, 'views'));
    });
  });

  describe ('hasViews', function () {
    it ('should test if the module has views', function () {
      let app = blueprint.app;
      let appModule = new ApplicationModule ({app, modulePath: app.appPath});

      expect (appModule.hasViews).to.be.true;
    });
  });

  describe ('lookup', function () {
    it ('should lookup an entity', function () {
      let app = blueprint.app;
      let appModule = new ApplicationModule ({app, modulePath: app.appPath});

      return appModule.configure ()
        .then (() => {
          let controller = appModule.lookup ('controller:main');
          expect (controller).to.equal (appModule.resources.controllers.main);
        });
    });
  });
});