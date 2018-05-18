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

const { omit } = require ('lodash');

/**
 * Transform the document by removing the hidden field.
 *
 * @param orig        Original transformation function
 * @param hidden      Fields to hide
 * @returns {Function}
 */
function transform (orig, hidden) {
  return function (doc, ret, options) {
    ret = omit (ret, hidden);

    return orig (doc, ret, options);
  }
}

/**
 * Plugin that allows you to specify what fields are hidden during transformation
 * via toObject() and toJSON(). To hide a field, add hidden=true to the field
 * definition in the model schema.
 *
 * @param schema        Mongoose schema
 * @constructor
 */
module.exports = function (schema) {
  // Gather the fields to be hidden during transformation.
  let hidden = [];

  schema.eachPath (function (path, schema) {
    if (schema.options.hidden)
      hidden.push (path);
  });

  if (!schema.options.toObject)
    schema.options.toObject = {};

  if (!schema.options.toJSON)
    schema.options.toJSON = {};

  let objTransform = schema.options.toObject.transform || function (doc, ret) { return ret; };
  schema.options.toObject.transform = transform (objTransform, hidden);

  let jsonTransform = schema.options.toJSON.transform || function (doc, ret) { return ret; };
  schema.options.toJSON.transform = transform (jsonTransform, hidden);

  // Define helper methods

  schema.statics.hidden = function () {
    return hidden;
  };
};
