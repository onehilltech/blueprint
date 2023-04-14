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

const debug = require ('debug')('blueprint-testing:bootstrap');
const blueprint = require ('@onehilltech/blueprint');

module.exports = function (appPath) {
  before (async function () {
    debug (`creating application: ${appPath}`);

    // Create and start the application.
    await blueprint.createApplicationAndStart (appPath);
    this.app = blueprint.app;

    // Notify all we are are beginning the testing process.
    await this.app.emit ('blueprint.test.begin');
  });

  beforeEach (async function () {
    debug ('starting a new test');

    await this.app.emit ('blueprint.test.start');
  });

  afterEach (async function () {
    debug ('ending the test');

    await this.app.emit ('blueprint.test.complete');
  });

  after (async function () {
    debug (`destroying application: ${appPath}`);

    // Notify all we are are ending the testing process.
    await this.app.emit ('blueprint.test.end');
    await this.app.destroy ();
  });
};
