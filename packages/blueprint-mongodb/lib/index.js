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

const {
  model,
  modelOn,
  resource,
  resourceOn
} = require ('./models');

const {
  Types,
  Schema
} = require ('mongoose');

const {
  seed,
  lean
} = require ('./utils');

Schema.Types.refersTo = Schema.Types.ref = require ('./schema/types/ref');

exports.Types = Types;
exports.Schema = Schema;

exports.plugins = require ('./plugins');

// model definitions
exports.model = model;
exports.modelOn = modelOn;
exports.resource = resource;
exports.resourceOn = resourceOn;

exports.ResourceController = require ('./resource-controller');
exports.SubdocumentResourceController = require ('./subdocument-resource-controller');
exports.GridFSController = require ('./gridfs-controller');
exports.populate = require ('./populate');
exports.lean = lean;
exports.seed = seed;

exports.Migration = require ('./migration');

exports.Seed = require ('./seed/seed');
