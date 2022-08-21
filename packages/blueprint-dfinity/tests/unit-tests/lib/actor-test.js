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

const HttpAgent = require('@dfinity/agent').HttpAgent;
const blueprint = require ('@onehilltech/blueprint');

const { expect } = require ('chai');

describe ('lib | Actor', function () {
  it ('should define an actor', function () {
    const helloFactory = blueprint.lookup ('actor:hello');

    expect (helloFactory)
      .to.have.property ('idl')
      .to.have.keys (['greet', 'greetq', 'whoami', 'record', 'service', 'variant', 'function']);
  });

  it ('should create an actor instance', function () {
    const helloFactory = blueprint.lookup ('actor:hello');
    const canisterId = 'rrkah-fqaaa-aaaaa-aaaaq-cai';
    const agent = new HttpAgent ({ host: 'http://localhost:8000' });
    const hello = helloFactory.createInstance ({ agent, canisterId });

    expect (hello).to.include.keys (['greet', 'greetq', 'whoami', 'record', 'service', 'variant', 'function']);
  });
});