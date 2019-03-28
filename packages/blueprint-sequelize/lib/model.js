/*
 * Copyright (c) 2019 One Hill Technologies, LLC
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
const Sequelize = require ('sequelize');

function model (name, schema, options) {
  const sequelize = blueprint.lookup ('service:sequelize');
  const defaultConnection = sequelize.defaultConnection;

  const Model = class extends Sequelize.Model { };
  return Model.init (schema, Object.assign ({ sequelize: defaultConnection }, options));
}

module.exports = model;
