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
const blueprint = require ('@onehilltech/blueprint');

// The dummy application has a well-defined location.
const appPath = path.resolve ('./tests/dummy/app');
const debug = require ('debug') ('blueprint-testing');

before (function () {
  debug ('starting all the test cases');
  return blueprint.createApplicationAndStart (appPath);
});

beforeEach (function () {
  debug ('starting a new test');
  return blueprint.emit ('blueprint.test.start')
});

afterEach (function () {
  debug ('test is complete');
  return blueprint.emit ('blueprint.test.complete');
});

after (function () {
  debug ('all test cases complete');
  return blueprint.destroyApplication ();
});
