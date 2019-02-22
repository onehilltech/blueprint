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

const cors = require ('cors');
const blueprint = require ('@onehilltech/blueprint');
const { merge } = require ('lodash');

function delegate (defaults) {
  const Client = blueprint.lookup ('model:client');
  const { origin: defaultOrigin, allowNullOrigin = true } = defaults;

  return function (req, callback) {
    // If there is no origin in the request, then we can disable cors.
    const origin = req.get ('origin');

    if (origin === null || origin === 'null')
      return callback (null, {origin: allowNullOrigin});

    if (!origin)
      return callback (null, {origin: false});

    // Let's attempt to locate a client with the origin in our collection of known
    // clients. We only accept request from origins that we know about.

    Client.findOne ({origin})
      .then (client => callback (null, merge ({}, defaults, { origin: !!client || defaultOrigin === true })))
      .catch (err => callback (err));
  };
}

module.exports = function (opts = {}) {
  return cors (delegate (opts));
};
