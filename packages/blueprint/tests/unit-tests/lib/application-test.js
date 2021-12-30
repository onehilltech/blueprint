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

const { expect } = require ('chai');
const blueprint = require ('../../../lib');

const express = require ('express');
const request = require ('supertest');

describe ('lib | Application', function () {
  describe ('configure', function () {
    it ('should configure the application', function () {
      expect (blueprint.app).to.have.nested.property ('resources.controllers').to.have.keys (['empty','main','namespace-user','user']);
      expect (blueprint.app).to.have.nested.property ('resources.listeners').to.have.property ('blueprint\\.app\\.init').to.have.keys (['echo','simple']);
      expect (blueprint.app).to.have.nested.property ('resources.policies').to.have.keys (['identity','test','user']);
      expect (blueprint.app).to.have.nested.property ('resources.routers').to.have.keys (['main','users','inner']);
    });
  });

  describe ('lookup', function () {
    it ('should lookup a loaded component', function () {
      let mainController = blueprint.app.lookup ('controller:main');

      expect (mainController).to.equal (blueprint.app.resources.controllers.main);
    });

    it ('should lookup a loaded configuration', function () {
      let appConfig = blueprint.app.lookup ('config:app');
      expect (appConfig).to.equal (blueprint.app.configs.app);
    });

    it ('should lookup a duplicate resource', function () {
      let controller = blueprint.app.lookup ('controller:empty');
      expect (controller.name).to.equal ('mod_a');
    });

    it ('should lookup a resource in a module', function () {
      let controllerA = blueprint.app.lookup ('controller:mod_a:empty');
      expect (controllerA.name).to.equal ('mod_a');

      let controllerB = blueprint.app.lookup ('controller:mod_b:empty');
      expect (controllerB.name).to.equal ('mod_b');
    });
  });

  describe ('mount', function () {
    it ('should mount a router', function () {
      let app = blueprint.app;

      const router = app.mount ('main');
      const server = express ();

      server.use (router);

      return request (server).get ('/main').expect (200, "true");
    });

    it ('should mount an inner router', function () {
      let app = blueprint.app;

      const router = app.mount ('inner.main');
      const server = express ();

      server.use (router);

      return request (server).get ('/main').expect (200, "true");
    });
  });
});
