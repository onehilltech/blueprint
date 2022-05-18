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

const { fromSeed } = require ('../../../../lib/identity');
const { expect } = require ('chai');

const SEED_PHRASE = 'early cinnamon crucial teach mobile just toast real rebel around card priority spike aerobic result account marble hero action intact inside elbow wrestle oval';

describe ('lib | identity | seed', function () {
  it ('should load an identity from a seed phrase', async function () {
    const identity = await fromSeed (SEED_PHRASE);

    expect (identity).to.not.be.undefined;
  });
});
