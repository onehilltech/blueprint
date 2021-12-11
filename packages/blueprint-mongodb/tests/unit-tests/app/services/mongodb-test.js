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
const mongoose = require ('mongoose');

const blueprint = require ('@onehilltech/blueprint');

describe ('app | services | mongodb', function () {
  it ('bootstrapping should configure the service', function () {
    const service = blueprint.lookup ('service:mongodb');
    expect (service.connections).to.have.keys (['$default', 'secondary']);
    expect (service.defaultConnection.conn).to.equal (mongoose.connections[0]);
  });
});
