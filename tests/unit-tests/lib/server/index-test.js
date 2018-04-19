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
      const tempPath = path.resolve ('../../../dummy/app/.temp');
      const config = {
        protocols: {
          http: {},
          https: {}
        }
      };

      let server = new Server ({app: blueprint.app});

      return server.configure (config).then (s => {
        expect (server).to.equal (s);

        expect (s.express).to.not.be.null;
        expect (s._mainRouter).to.not.be.null;
        expect (s.viewCachePath).to.equal (path.join (blueprint.app.tempPath, 'views'));
      });
    });
  });

  describe ('importViews', function () {
    it ('should import view for use by the server', function () {
      const viewsPath = path.resolve (__dirname, '../../../dummy/app/views');
      const tempPath = path.resolve (__dirname, '../../../dummy/app/.temp');

      const app = { tempPath, resources: {} };

      let server = new Server ({app});

      return server.configure ({}).then (() => {
        return server.importViews (viewsPath);
      }).then (() => {
        expect (server._engines).to.eql (['handlebars']);
      });
    });
  });
});
