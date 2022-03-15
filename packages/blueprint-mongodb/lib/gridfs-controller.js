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
const blueprint = require ('@onehilltech/blueprint');
const BluebirdPromise = require ('bluebird');

const {
  ResourceController,
  Action,
  SingleFileUploadAction,
  HttpError,
  Mixin,
  computed,
} = blueprint;

const {
  GridFSBucket
} = require ('mongodb');

const fs = require ('fs-extra');

const toMongoId = require ('../app/sanitizers/toMongoId');

function makeResourceIdSchema (location) {
  return {
    in: location,
    isMongoId: {errorMessage: 'The id is not valid.'},
    customSanitizer: {
      options: toMongoId
    }
  }
}

const {
  Types: {
    ObjectId
  }
} = require ('mongoose');

/**
 * @mixin TranslateErrorMixin
 *
 * Mixin for translating error responses.
 */
const TranslateErrorMixin = Mixin.create ({
  _translateError (err) {
    if (err.message.startsWith ('FileNotFound:')) {
      return Promise.reject (new HttpError (404, 'not_found', 'The resource does not exist.'));
    }
    else {
      return Promise.reject (err);
    }
  }
});

/**
 * @class GridFSController
 *
 * Resource controller for resources stored in GridFS.
 */
module.exports = ResourceController.extend ({
  /// Name of the resource.
  name: null,

  /// The bucket name for the resources. If one is not provided, then the name
  /// of the resource is used for the bucket name.
  bucketName: null,

  /// Name of the target connection. The $default connection is the
  /// default target connection.
  connection: '$default',

  /// Number of bytes stored in each chunk. Defaults to 255KB.
  chunkSizeBytes: 255 * 1024,

  /// Optional write concern to be passed to write operations, for instance { w: 1 }.
  writeConcern: null,

  /// Optional read preference to be passed to read operations.
  readPreference: null,

  /// The GridFS bucket.
  _bucket: null,

  bucket: computed ({
    get () {
      if (this._bucket)
        return this._bucket;

      if (!this._connection)
        throw new Error ('There is no connection to the database.');

      if (!this._connection.isOpen)
        throw new Error ('The connection to the database is not open.');

      let opts = {
        bucketName: this.bucketName || this.name,
        chunkSizeBytes: this.chunkSizeBytes
      };

      if (this.writeConcern)
        opts.writeConcern = this.writeConcern;

      if (this.readPreference)
        opts.readPreference = this.readPreference;

      this._bucket = new GridFSBucket (this._connection.conn.db, opts);

      return this._bucket;
    }
  }),

  init () {
    this._super.call (this, ...arguments);

    const mongodb = blueprint.lookup ('service:mongodb');
    assert (!!mongodb, 'The mongodb service is not loaded.');

    this._connection = mongodb.connections[this.connection];
    assert (!!this._connection, `The connection named ${this.connection} does not exist.`);

    // Listen for the connection open event.
    this._connection.once ('close', this._onConnectionClose.bind (this));
  },

  /**
   * Drop all the files and chucks for the bucket.
   *
   * @returns {*}
   */
  drop () {
    return this.bucket.drop ();
  },

  /**
   * Create a single resource in GridFS.
   */
  create () {
    return SingleFileUploadAction.extend (TranslateErrorMixin, {
      name: this.name,

      init () {
        this._super.call (this, ...arguments);

        // Determine how to get the upload from the request based on the options
        // used to create the upload property.
        this._write = this.storageType === 'memory' ? this._writeBuffer : this._writeFile;
      },

      onUploadComplete (req, res) {
        let options = { contentType: req.file.mimetype};
        let metadata = {};

        let promises = [
          this.prepareOptions (req, options),
          this.prepareMetadata (req, metadata)
        ];

        return Promise.all (promises)
          .then (([options, metadata]) => {
            return Promise.resolve (this.preWriteUpload (req))
              .then (() => {
                if (Object.keys (metadata).length !== 0)
                  options.metadata = metadata;

                let upload = this.controller.bucket.openUploadStream (req.file.originalname, options);

                return this._write (req, upload)
                  .then (() => this.postWriteUpload (req))
                  .then (() => this.prepareResponse (res, {[this.controller.name]: {_id: upload.id}}))
                  .then (response => res.status (200).json (response));
              });
          });
      },

      prepareOptions (req, options) {
        return options;
      },

      prepareMetadata (req, metadata) {
        return metadata;
      },

      preWriteUpload (req) {

      },

      postWriteUpload (req) {

      },

      prepareResponse (res, data) {
        return data;
      },

      _writeBuffer (req, upload) {
        const {buffer,encoding} = req.file;

        return BluebirdPromise.fromCallback ((callback) => {
          upload.end (buffer, encoding, callback);
        });
      },

      _writeFile (req, upload) {
        return new Promise ((resolve,reject) => {
          fs.createReadStream (req.file.path)
            .pipe (upload)
            .once ('error', reject)
            .once ('finish', resolve);
        });
      }
    })
  },

  /**
   * Get a single resource from the GridFS.
   */
  getOne () {
    return Action.extend ({
      schema: {
        [this.id]: {
          in: 'params',
          isMongoId: { errorMessage: 'The resource id is invalid.' },
          toMongoId: true
        }
      },

      async execute (req, res) {
        await this.preGetItem (req);
        const item = await this.getItem (req);
        await this.postGetItem (req, item);
        await this.downloadItem (req, res, item);
      },

      preGetItem (req) {

      },

      getItem (req) {
        const id = req.params[this.controller.id];

        return new Promise ((resolve, reject) => {
          let cursor = this.controller.bucket.find ({_id: id}, {limit: 1});

          cursor.next (function (err, item) {
            // Make sure we close the cursor.
            cursor.close ();

            if (err)
              return reject (err);

            if (!item)
              return reject (new HttpError (404, 'not_found', 'The resource does not exist.'));

            return resolve (item);
          });
        });
      },

      postGetItem (req, item) {
        return item;
      },

      downloadItem (req, res, item) {
        const id = req.params[this.controller.id];

        return new Promise ((resolve, reject) => {
          const download = this.controller.bucket.openDownloadStream (id);

          // We know this resource will never be updated because there is no update action
          // supported by the GridFS controller. Let's instruct the browser to cache this
          // resource forever by setting its expiration to 1 year.

          res.set ('Cache-Control', this.getCacheControl (req, item));
          res.type (item.contentType);

          download
            .pipe (res)
            .once ('error', reject)
            .once ('finish', resolve);
        });
      },

      getCacheControl (req, item) {
        return 'public, max-age=31536000, immutable'
      }
    });
  },

  /**
   * Delete a single resource from GridFS.
   *
   * @returns {*}
   */
  delete () {
    return Action.extend (TranslateErrorMixin, {
      schema: {
        [this.id]: makeResourceIdSchema ('params')
      },

      execute (req, res) {
        const id = req.params[this.controller.id];

        return Promise.resolve (this.preDelete (req))
          .then (() => this.controller.bucket.delete (id))
          .then (() => this.postDelete ())
          .then (() => this.prepareResponse (res, true))
          .then (result => {
            res.status (200).json (result);
          })
          .catch (this._translateError.bind (this));
      },

      preDelete (req) {

      },

      postDelete () {

      },

      prepareResponse (res, result) {
        return result;
      }
    });
  },

  _onConnectionClose () {
    this._bucket = null;
  }
});
