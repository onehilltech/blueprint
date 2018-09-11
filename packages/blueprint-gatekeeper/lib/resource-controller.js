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

const { ResourceController } = require ('@onehilltech/blueprint-mongodb');
const { model } = require ('@onehilltech/blueprint');

/**
 * @class GatekeeperResourceController
 *
 * Resource controller that supports event logging.
 */
module.exports = ResourceController.extend ({
  ResourceEvent: model ('resource-event'),

  logging: false,

  create () {
    return this._super.call (this, ...arguments).extend ({
      postCreateModel (req, model) {
        // The model has been successfully created. Log an event so we have a
        // record of the creation occurring.

        return Promise.resolve (this._super.call (this, ...arguments))
          .then (result => this.controller._logModelEvent (req, 'created', model).then (() => result));
      }
    });
  },

  getOne () {
    return this._super.call (this, ...arguments).extend ({
      postGetModel (req, model) {
        // Log an event capturing the retrieved model.

        return Promise.resolve (this._super.call (this, ...arguments))
          .then (result => this.controller._logModelEvent (req, 'retrieved', model).then (() => result));
      }
    });
  },

  getAll () {
    return this._super.call (this, ...arguments).extend ({
      postGetModels (req, models) {
        // Log an event capturing the retrieved models.

        return Promise.resolve (this._super.call (this, ...arguments))
          .then (result => this.controller._logModelArrayEvent (req, 'retrieved', models).then (() => result));
      }
    });
  },

  update () {
    return this._super.call (this, ...arguments).extend ({
      postUpdateModel (req, model) {
        // Log an event capturing the updated model.

        return Promise.resolve (this._super.call (this, ...arguments))
          .then (result => this.controller._logModelEvent (req, 'updated', model).then (() => result));
      }
    });
  },

  delete () {
    return this._super.call (this, ...arguments).extend ({
      postDeleteModel (req, model) {
        // The model has been deleted. Pass control to the base class and then
        // add an event the database signifying the deletion.

        return Promise.resolve (this._super.call (this, ...arguments))
          .then (result => this.controller._logModelEvent (req, 'deleted', model).then (() => result));
      }
    });
  },

  /**
   * Log a model event.
   *
   * @param req
   * @param action
   * @param model
   * @private
   */
  _logModelEvent (req, action, model) {
    if (!this.logging)
      return Promise.resolve ();

    return this._logEvent (req, action, [model._id]);
  },

  /**
   * Log an event related to an array of models.
   *
   * @param req
   * @param action
   * @param models
   * @private
   */
  _logModelArrayEvent (req, action, models) {
    if (!this.logging)
      return Promise.resolve ();

    return this._logEvent (req, action, models.map (model => model._id));
  },

  /**
   * Log an event to the database.
   *
   * @param req
   * @param action
   * @param id
   * @private
   */
  _logEvent (req, action, id) {
    if (!this.logging)
      return Promise.resolve ();

    const event = {
      client: req.accessToken.client,
      user: req.accessToken.account,
      action,
      resource: { id, name: this.name },

      request: {
        ip: req.ip,
        url: req.url
      }
    };

    return this.ResourceEvent.create (event);
  }
});
