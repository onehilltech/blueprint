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

const supertest = require ('supertest');
const blueprint = require ('@onehilltech/blueprint');

/**
 * Make a test request. If no Express.js application is provided, then
 * the request is sent to the current Blueprint.js application.
 *
 * @param app     Optional application
 *
 * @returns {Test}
 */
function request (app) {
  app = app || blueprint.app.server.express;
  return supertest (app);
}

module.exports = request;
