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
const { isString} = require ('lodash');

const {
  Model,
  Schema: {
    Types: {
      DocumentArray,
      ObjectId
    }
  }
} = require ('mongoose');

/**
 * Define a model ref type.
 *
 * @param model
 * @param opts
 */
module.exports = function (model, opts = {}) {
  const M = isString (model) ? blueprint.lookup (`model:${model}`) : model;

  if ((M.prototype instanceof Model)) {
    // This is a reference to a top-level document.
    const { modelName } = M;
    return Object.assign ({}, opts, { type: ObjectId, ref: modelName });
  }
  else if ((M instanceof DocumentArray)) {
    // This is a reference to a nested document. We cannot populate it because
    // it does not have a stand-alone object id.

    return Object.assign ({}, opts, { type: ObjectId });
  }
  else {
    throw new Error (`${model} is not a value reference type.`);
  }
};
