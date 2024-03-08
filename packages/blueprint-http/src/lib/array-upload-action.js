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

const assert = require ('assert');
const UploadAction = require ('./upload-action');

/**
 * @class ArrayUploadAction
 *
 * Action for uploading an array files. The files will be available on req.files
 * in onUploadComplete(req,res).
 */
module.exports = class ArrayUploadAction extends UploadAction {
  /// The name of the field that will contain the uploaded files.
  name = null;

  /**
   * @override
   */
  createUploadMiddleware (options) {
    assert (!!this.name, "You must define the 'name' property.");

    return this._upload.array (this.name);
  }
}
