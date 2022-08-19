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

describe ('lib | Application', function () {
  describe ('configure', function () {
    it ('should load the modules', function () {
      expect (blueprint.app.modules).to.have.keys (['mod_a', 'mod_b']);
    });
  });

  describe ('lookup', function () {
    it ('should lookup application components', function () {
      expect (blueprint.lookup ('service:cart')).to.exist;
      expect (blueprint.lookup ('service:shopping-cart')).to.exist;

      expect (blueprint.lookup ('listener:blueprint.app.init:echo')).to.exist;
      expect (blueprint.lookup ('listener:blueprint.app.init:simple')).to.exist;
    });
  });
});
