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

const multer = require ('multer');
const Action = require ('./action');
const { resolve } = require ('path');
const { merge } = require ('lodash');
const { computed } = require ('base-object');
const { ensureDirSync } = require ('fs-extra');
const { fromCallback } = require ('bluebird');

/**
 * @class UploadAction
 *
 * Base class for all upload actions. This action will initialize a new instance
 * of multer, and store it internally for subclasses to use.
 */
module.exports = Action.extend ({
  /// The default upload path for all files. This will default to [appPath]/uploads,
  /// if nothing is provided.
  uploadPath: null,

  /// The other options for multer.
  uploadOptions: null,

  // The middleware for completing the upload.
  _middleware: null,

  storageType: computed ({
    get () { return this._options.dest ? 'disk' : 'memory'; }
  }),

  /**
   * @override
   */
  async configure (controller) {
    await this._super.call (this, ...arguments);

    if (!this.uploadPath)
      this.uploadPath = resolve (this.app.tempPath, 'uploads');

    const baseOptions = {};
    const { storage } = this.uploadOptions || {};

    if (!storage) {
      // Configure the upload path, and make sure the directory exists.
      baseOptions.dest = this.uploadPath;
      ensureDirSync (this.uploadPath);
    }

    this._options = merge (baseOptions, this.uploadOptions);
    this._upload = multer (this._options);
  },

  /**
   * Execute the action.
   *
   * @param req     The request object.
   * @param res     The response object.
   */
  async execute (req, res) {
    await fromCallback (callback => this._middleware (req, res, callback));
    return this.onUploadComplete (req, res);
  },

  /**
   * Notify the subclass the upload is complete.
   *
   * @param req     The request object.
   * @param res     The response object.
   * @returns {null}
   */
  async onUploadComplete (req, res) {
    return null;
  }
});
