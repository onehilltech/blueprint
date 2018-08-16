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

const { fromCallback } = require ('bluebird');

/**
 * Factory method that generates a middleware function for rendering a static
 * view to a request.
 *
 * @param view
 * @returns {Function}
 */
module.exports = function render (view) {
  return function __blueprint_render (req, res, next) {
    return fromCallback (callback => res.render (view, callback))
      .then (html => res.status (200).send (html))
      .then (() => next ())
      .catch (next);
  };
};
