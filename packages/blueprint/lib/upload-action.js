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
const framework = require ('./-framework');
const { resolve } = require ('path');
const { merge, get } = require ('lodash');
const { computed } = require ('base-object');
const { ensureDirSync } = require ('fs-extra');

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

  _middleware: null,

  storageType: computed ({
    get () { return this._options.dest ? 'disk' : 'memory'; }
  }),

  init () {
    this._super.call (this, ...arguments);

    if (!this.uploadPath)
      this.uploadPath = resolve (framework.app.tempPath, 'uploads');

    let baseOptions = {};
    let storage = get (this.uploadOptions, 'storage');

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
  execute (req, res) {
    return this._uploadFile (req, res).then (() => this.onUploadComplete (req, res));
  },

  /**
   * Upload the file.
   *
   * @param req     The request object.
   * @param res     The response object.
   */
  _uploadFile (req, res) {
    return new Promise ((resolve,reject) => {
      this._middleware (req, res, err => {
        return !err ? resolve () : reject (err);
      })
    });
  },

  /**
   * Notify the subclass the upload is complete.
   *
   * @param req     The request object.
   * @param res     The response object.
   * @returns {null}
   */
  onUploadComplete (req, res) {
    return null;
  }
});
