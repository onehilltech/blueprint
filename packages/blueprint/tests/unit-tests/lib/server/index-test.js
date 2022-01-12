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

const {expect} = require ('chai');
const Server = require ('../../../../lib/server');
const path = require ('path');

const blueprint = require ('../../../../lib');

describe ('lib | server | Server', function () {
  describe ('constructor', function () {
    it ('should create a server object', function () {
      const app = {};

      let server = new Server ({app});

      expect (server).to.not.be.null;
    });
  });

  describe ('configure', function () {
    it ('should configure the server using default configurations', function () {
      const { server } = blueprint.app;

        expect (server.express).to.not.be.null;
        expect (server._mainRouter).to.not.be.null;
        expect (server.viewCachePath).to.equal (path.join (blueprint.app.tempPath, 'views'));
    });
  });

  describe ('importViews', function () {
    it ('should import view for use by the server', async function () {
      const server = new Server ({app: blueprint.app});
      await server.configure ({});
      await server.importViews (blueprint.app.viewsPath);

      expect (server._engines).to.eql (['handlebars'])
    });
  });
});
