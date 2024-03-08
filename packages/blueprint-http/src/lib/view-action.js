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
module.exports = class ViewAction extends Action {
  /**
   * Get the view template for the action. The view is used to render a
   * response to the caller.
   *
   * @params req        The request object
   * @returns {String|Promise}
   */
  async view (req) {
    throw new Error ('You must override the view() method.');
  }

  /**
   * Get the data model used to populate the template.
   *
   * @params req              The request object
   */
  async model (req) {
    return null;
  }

  /**
   *
   * @param req       The request object
   * @param res       The response object
   * @returns {Promise}
   */
  async execute (req, res) {
    // Get the new and the model from the subclass.
    const [view, model] = await Promise.all ([ this.view (req), this.model (req) ]);

    // Render the view using the provided model.
    return res.render (view, model);
  }
};
