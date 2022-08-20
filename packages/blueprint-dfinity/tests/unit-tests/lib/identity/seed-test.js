/*
 * Copyright (c) 2022 One Hill Technologies, LLC
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

const { fromSeedFile } = require ('../../../../lib/identity');
const { expect } = require ('chai');
const path = require ("path");
const blueprint = require ('@onehilltech/blueprint');

describe ('lib | identity | seed', function () {
  it ('should load an identity from a seed phrase', async function () {
    const file = path.resolve (blueprint.app.assetsPath, 'seed.txt');
    const identity = await fromSeedFile (file);

    expect (identity).to.not.be.undefined;
  });
});
