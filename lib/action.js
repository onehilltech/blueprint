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

const BlueprintObject = require ('./object');

/**
 * @class Action
 *
 * The base class for all actions.
 */
module.exports = BlueprintObject.extend ({
  /**
   * Optional middleware function(s) for validating the request that triggered
   * the action.
   */
  validate: null,

  /**
   * Optional express-validator schema for validating the request that
   * trigger the action.
   */
  schema: null,

  /**
   * Execute the request.
   *
   * The signature of this method is f(req, res);
   *
   * This method has the option of returning a Promise, which informs the framework
   * that completion of the request is pending.
   *
   * @returns {Promise|null}
   */
  execute: null,

  /// The hosting controller for the action.
  controller: null,
});
