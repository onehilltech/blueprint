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
const { BO } = require ('base-object');

describe.skip ('lib | ModuleLoader', function () {
  describe ('constructor', function () {
    it ('should create a ModuleLoader', function () {
      let app = new Application ({appPath});
      let m = new ModuleLoader ({app});

      expect (m).to.not.be.null;
    });
  });

  describe ('load', function () {
    it ('should the application modules', function () {
      // Make a mock application for the loader.
      let app = BO.create ({
        appPath,
        resources: {},
        modules: {}
      });

      let modules = {};

      let loader = new ModuleLoader ({app});
      loader.on ('loading', module => modules[module.name] = module);

      return loader.load ().then (() => {
        expect (modules).to.have.property ('mod_a');
        expect (modules).to.have.property ('mod_b');
      });
    });
  });
});
