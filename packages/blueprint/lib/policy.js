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

const { BO } = require ('base-object');

/**
 * @class Policy
 *
 * Base class for all policies. All policies must override the runCheck()
 * method, which is used to evaluate the policy.
 */
module.exports = BO.extend ({
  /// The default code for a policy failure.
  failureCode: 'policy_failed',

  /// The default message for a policy failure.
  failureMessage: 'The request did not satisfy a required policy.',

  /**
   * Set the parameters of the policy. The arguments to this method will be the
   * ones passed to the check() definition.
   */
  setParameters () {

  },

  /**
   * Run the policy check. This method can be evaluated either synchronously or
   * asynchronously. If you are evaluating the policy synchronously, then you must
   * return a boolean value. True if the policy passes, or false if the policy fails.
   *
   * If you are evaluating the policy asynchronously, then you must return a Promise.
   * The promise must settle with a boolean value.
   *
   * If there is an error, then you can throw an exception, or settle a promise by
   * rejecting it with an exception. The latter is the preferred approach.
   *
   * @params req                  Incoming request
   * @return {Boolean|Promise}    Policy evaluation
   */
  runCheck: null
});

