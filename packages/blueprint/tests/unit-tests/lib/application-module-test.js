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
const { expect } = require ('chai');
const blueprint = require ('../../../lib');

describe ('lib | ApplicationModule', function () {
  describe ('assetPath', function () {
    it ('should define the path for the module assets', function () {
      const mod_b = blueprint.app.modules['mod_b'];
      const assetsPath = path.resolve (mod_b.modulePath, 'assets');

      expect (mod_b.assetsPath).to.equal (assetsPath);
    });
  });

  describe ('asset', function () {
    it ('should read an asset from the application module', async function () {
      const asset = await blueprint.app.modules['mod_a'].asset ('helloworld.txt');
      expect (asset.toString ()).to.equal ('Hello, World!');
    })
  });
});