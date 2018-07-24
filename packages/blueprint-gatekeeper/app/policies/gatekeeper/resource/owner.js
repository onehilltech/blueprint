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
const { Policy, UnauthorizedError } = require ('@onehilltech/blueprint');

module.exports = Policy.extend ({
  failureCode: 'invalid_owner',

  failureMessage: 'You are not the owner of the resource.',

  /// The model in question.
  _Model: null,

  /// Name of the model.
  _modelName: null,

  /// The user path for ownership.
  _userPath: null,

  /// The resource id parameter in the request.
  _rcId: null,

  setParameters (rcId, definition) {
    this._rcId = rcId;

    // Get the model name and the user path from the definition.
    [this._modelName, this._userPath] = definition.split ('@');

    // Lookup the model in our repo.
    this._Model = blueprint.lookup (`model:${this._modelName}`);
  },

  /**
   * Run the policy check.
   */
  runCheck (req) {
    // We need to locate the specified resource and make sure we are the
    // owner of the resource.

    const _id = req.params[this._rcId];
    const selection = { _id, [this._userPath]: req.user._id };

    return this._Model.findOne (selection).then (model => !!model);
  },
});
