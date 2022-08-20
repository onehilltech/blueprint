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

const blueprint = require ('@onehilltech/blueprint');
const { expect } = require ('chai');

describe.only ('app | services | dfinity', function () {
  it ('should initialize the service', function () {
    const dfinity = blueprint.lookup ('service:dfinity');

    expect (dfinity.agents).to.have.keys (['$default', 'key', 'phrase']);
    expect (dfinity.agents.$default._host.toString ()).to.equal ('http://localhost:8000/');

    expect (dfinity.canisters).to.eql ({
      $default: 'rrkah-fqaaa-aaaaa-aaaaq-cai'
    });

    expect (dfinity.app.lookup ('actor:hello')).to.be.defined;
  });

  it ('should create a new instance', async function () {
    // We need to increase the timeout since there is a delay in connecting.
    this.timeout (10000);

    // Let's create an instance of the actor.
    const dfinity = blueprint.lookup ('service:dfinity');
    const hello = dfinity.createInstance ('hello');

    expect (hello).to.not.be.undefined;

    // Now, let's call the greet method on the actor.
    const message = await hello.greet ('OneHillTech');
    expect (message).to.equal ('Hello, OneHillTech!');
  });
});