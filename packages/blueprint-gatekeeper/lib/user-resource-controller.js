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

const ResourceController = require ('./resource-controller');
const { set } = require ('lodash');

/**
 * @class UserResourceController
 *
 * A controller for resources owned by a user. The user resource controller will
 * add the current user making the result as the owner of the resource.
 *
 * The resource controller does not restrict access to the resource. Instead, this
 * is done with the gatekeeper.resource.owner policy.
 */
module.exports = ResourceController.extend ({
  /// The user path in the model.
  userPath: 'user',

  create () {
    return this._super.call (this, ...arguments).extend ({
      prepareDocument (req, doc) {
        // Set the user path on the document being created.
        set (doc, this.controller.userPath, req.user._id);

        return doc;
      }
    })
  }
});
