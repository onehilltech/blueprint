/*
 * Copyright (c) 2022 One Hill Technologies, LLC
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

/// Collection of registries.
const __registries__ = new Map ();

const Registry = require ('./registry');

/**
 * Lookup a registry.
 *
 * @param id        Id if the register to lookup.
 */
module.exports = function lookup (id) {
  let registry = __registries__.get (id);

  if (!!registry)
    return registry;

  registry = new Registry ();
  __registries__.set (id, registry);

  return registry;
}
