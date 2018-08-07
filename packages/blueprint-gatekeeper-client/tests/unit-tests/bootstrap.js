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

const path  = require ('path');
const blueprint = require ('@onehilltech/blueprint-testing');
const nock = require ('nock');

const appPath = path.resolve (__dirname, '../dummy/app');

nock ('http://gatekeeper')
  .post ('/oauth2/token', {grant_type: 'client_credentials'})
  .reply (200);

blueprint.bootstrap (appPath);

