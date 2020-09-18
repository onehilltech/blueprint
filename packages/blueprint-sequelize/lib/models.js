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
const { isString } = require ('lodash');

function model (name, schema, options) {
  const sequelize = blueprint.lookup ('service:sequelize');
  const defaultConnection = sequelize.defaultConnection;

  const Model = class extends Sequelize.Model { };
  const immutableOptions = { modelName: name };
  const defaultOptions = { sequelize: defaultConnection };

  if (!!options.sequelize && isString (options.sequelize))
    options.sequelize = sequelize.connections[option.sequelize];

  const M = Model.init (schema, Object.assign ({}, defaultOptions, options, immutableOptions));

  Object.defineProperty (schema.options, 'resource', { enumerable: true, writable: false, value: true });

  return M;
}

function resource (name, schema, options) {
  const sequelize = blueprint.lookup ('service:sequelize');
  const defaultConnection = sequelize.defaultConnection;

  const Model = class extends Sequelize.Model { };
  const immutableOptions = { modelName: name, resource: true };
  const defaultOptions = { sequelize: defaultConnection };

  if (!!options.sequelize && isString (options.sequelize))
    options.sequelize = sequelize.connections[options.sequelize];

  return Model.init (schema, Object.assign ({}, defaultOptions, options, immutableOptions));
}

exports.model = model;
exports.resource = resource;
