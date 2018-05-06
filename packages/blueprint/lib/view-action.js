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

const Action = require ('./action');
const assert = require ('assert');

/**
 * @class ViewAction
 *
 * A ViewAction is an action that generates a view based on the content
 * of the request it is processing.
 */
module.exports = Action.extend ({
  init () {
    this._super.call (this, ...arguments);

    assert (!!this.view, "The 'view(req)' method must be defined by the subclass.");
  },

  /**
   * Get the view template for the action. The view is used to render a
   * response to the caller.
   *
   * @params req        The request object
   * @returns {String|Promise}
   */
  view: null,

  /**
   * Get the data model used to populate the template.
   *
   * @params req        The request object
   * @returns Promise
   */
  model (req) {
    return null;
  },

  /**
   *
   * @param req       The request object
   * @param res       The response object
   * @returns {Promise}
   */
  execute (req, res) {
    // Get the new and the model from the subclass.
    let vp = this.view (req);
    let mp = this.model (req);

    return Promise.all ([vp,mp]).then (results => {
      let [view, model] = results;

      res.render (view, model);
    });
  }
});
