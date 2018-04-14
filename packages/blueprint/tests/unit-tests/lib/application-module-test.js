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

const path     = require ('path');
const {expect} = require ('chai');
const ApplicationModule = require ('../../../lib/application-module');
const MessagingFramework = require ('../../../lib/messaging/framework');

describe.skip ('lib | ApplicationModule', function () {
  describe ('constructor', function () {
    it ('should create a new ApplicationModule', function () {
      let appPath = path.resolve (__dirname, '../../fixtures/app-module');

      let appModule = new ApplicationModule ({
        appPath,
        messaging: new MessagingFramework ()
      });

      expect (appModule).to.deep.include ({appPath, _resources: {}});
    });
  });

  describe ('configure', function () {
    it ('should load an application module into memory', function () {
      let appPath = path.resolve (__dirname, '../../fixtures/app-module');
      let appModule = new ApplicationModule ({
        appPath,
        messaging: new MessagingFramework ()
      });

      return appModule.configure ().then (result => {
        expect (appModule).to.equal (result);

        expect (result._resources).to.have.nested.property ('models.person');
        expect (result._resources).to.have.nested.property ('models.logger');
        expect (result._resources).to.not.have.nested.property ('models.monitor');

        expect (result._resources).to.have.nested.property ('controllers.module-test');

        expect (result._resources).to.have.property ('listeners').to.have.property ('blueprint.module.init');
      });
    });
  });

  describe ('viewsPath', function () {
    it ('should get the viewPaths property', function () {
      let appPath = path.resolve (__dirname, '../../dummy/app');
      let appModule = new ApplicationModule ({
        appPath,
        messaging: new MessagingFramework ()
      });

      expect (appModule.viewsPath).to.equal (path.join (appPath, 'views'));
    });
  });

  describe ('hasViews', function () {
    it ('should test if the module has views', function () {
      let appPath = path.resolve (__dirname, '../../dummy/app');
      let appModule = new ApplicationModule ({
        appPath,
        messaging: new MessagingFramework ()
      });

      expect (appModule.hasViews).to.be.true;
    });
  });

  describe ('lookup', function () {
    it ('should lookup an entity', function () {
      let appPath = path.resolve (__dirname, '../../dummy/app');
      let appModule = new ApplicationModule ({
        appPath,
        messaging: new MessagingFramework ()
      });

      return appModule.configure ()
        .then (() => {
          let controller = appModule.lookup ('controller:MainController');
          expect (controller).to.not.be.undefined;
        });
    });
  });
});