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

const request    = require ('supertest');
const express    = require ('express');
const Router     = require ('../../../lib/router');
const blueprint  = require ('../../../lib');

describe ('lib | Router', function () {
  describe ('build', function () {
    it ('should build router containing action with single function', async function () {
      const r1 = {
        '/r1': {
          get: {action: 'main@getFunction'},
        }
      };

      const router = new Router ({specification: r1});

      let app = express ();
      app.use (await router.build (blueprint.app));

      return request (app)
        .get ('/r1')
        .expect (200, {result: 'getFunction'});
    });
  });
});
