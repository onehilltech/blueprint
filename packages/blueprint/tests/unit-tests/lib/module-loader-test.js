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
const path = require ('path');
const ModuleLoader = require ('../../../lib/module-loader');
const Application = require ('../../../lib/application');
const appPath = path.resolve ('./tests/dummy/app');

describe ('lib | ModuleLoader', function () {
  describe ('load', function () {
    it ('should the application modules', async function () {
      const app = new Application (appPath);
      const loader = new ModuleLoader (app);
      const modules = await loader.load ();

      expect (modules).to.have.length (2);
      expect (modules.map (module => module.name)).to.eql (['mod_b', 'mod_a']);
    });
  });
});
