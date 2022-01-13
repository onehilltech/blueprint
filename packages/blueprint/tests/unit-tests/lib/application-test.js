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
      expect (blueprint.app).to.have.nested.property ('resources.listeners').to.have.property ('blueprint\\.app\\.init').to.have.keys (['echo','simple']);

      expect (blueprint.app).to.have.nested.property ('resources.services').to.have.property ('cart');
      expect (blueprint.app).to.have.nested.property ('resources.services').to.have.property ('shopping-cart');
    });
  });

  describe ('lookup', function () {
    it ('should lookup a loaded component', function () {
      const cart = blueprint.app.lookup ('service:cart');
      expect (cart).to.equal (blueprint.app.resources.services.cart);
    });

    it ('should lookup a loaded configuration', function () {
      let appConfig = blueprint.app.lookup ('config:app');
      expect (appConfig).to.equal (blueprint.app.configs.app);
    });

    it ('should lookup a duplicate resource', function () {
      let controller = blueprint.app.lookup ('service:cart');
      expect (controller.name).to.equal ('mod_a');
    });

    it ('should lookup a resource in a module', function () {
      const serviceA = blueprint.app.lookup ('service:mod_a:cart');
      expect (serviceA.name).to.equal ('mod_a');

      const serviceB = blueprint.app.lookup ('service:mod_b:cart');
      expect (serviceB.name).to.equal ('mod_b');
    });
  });

  describe.skip ('mount', function () {
    it ('should mount a router', async function () {
      const router = await blueprint.app.mount ('main');
      const server = express ();

      server.use (router);

      return request (server).get ('/main').expect (200, "true");
    });

    it ('should mount an inner router', async function () {
      const router = await blueprint.app.mount ('inner.main');
      const server = express ();

      server.use (router);

      return request (server).get ('/main').expect (200, "true");
    });
  });
});
