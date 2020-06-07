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

const blueprint = require ('@onehilltech/blueprint');
const { Listener } = blueprint;
const { mapValues } = require ('lodash');

const debug = require ('debug') ('blueprint-sequelize:listeners:blueprint.test.start:seed');

const { props } = require ('bluebird');

module.exports = Listener.extend ({
  handleEvent () {
    let sequelize = blueprint.lookup ('service:sequelize');

    if (!sequelize)
      return;

    debug ('seeding all database connections');

    const opts = {
      clearBeforeSeeding: []
    };

    return props (mapValues (sequelize.connections, (conn, name) => sequelize.seedConnection (name, conn, opts)));
  }
});
