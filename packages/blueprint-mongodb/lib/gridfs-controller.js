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
  barrier
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

/**
 * @class GridFSController
 *
 * Resource controller for resources stored in GridFS.
 */
module.exports = ResourceController.extend ({
  /// Name of the resource.
  name: null,

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

  init () {
    this._super.call (this, ...arguments);

    const mongodb = blueprint.lookup ('service:mongodb');
    assert (!!mongodb, 'The mongodb service is not loaded.');

    this._connection = mongodb.connections[this.connection];
    assert (!!this._connection, `The connection named ${this.connection} does not exist.`);

    // Listen for the connection open event.
    this._connection.once ('open', this._onConnectionOpen.bind (this));
    this._appStart = barrier ('blueprint.app.start', this);

    Object.defineProperty (this, 'bucket', {
      get () {
        if (this._bucket)
          return this._bucket;

        console.error ('The target bucket does not exist.');
        throw new Error ('The target bucket does not exist.');
      }
    });
  },

  /**
   * Create a single resource in GridFS.
   */
  create () {
    return SingleFileUploadAction.extend ({
      name: this.name,

      onUploadComplete (req, res) {
        let options = { contentType: req.file.mimetype};
        let metadata = {};

        let promises = [
          this.prepareOptions (req, options),
          this.prepareMetadata (req, metadata)
        ];

        return Promise.all (promises)
          .then (([options,metadata]) => {
            return Promise.resolve (this.preWriteUpload (req))
              .then (() => {
                if (Object.keys (metadata).length !== 0)
                  options.metadata = metadata;

                return this.controller.bucket.openUploadStream (req.file.originalname, options);
              })
              .then (upload => {
                let promise;

                if (req.file.path) {
                  promise = this._writeFile (req, upload);
                }
                else if (req.file.buffer) {
                  promise = this._writeBuffer (req, upload);
                }
                else {
                  return Promise.reject (new HttpError (500, 'bad_upload', 'Failed to upload and save file.'));
                }

                return promise
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
            .on ('error', reject)
            .on ('finish', resolve);
        });
      }
    })
  },

  /**
   * Delete a single resource from GridFS.
   *
   * @returns {*}
   */
  delete () {
    return Action.extend ({
      schema: {
        [this.id]: makeResourceIdSchema ('params')
      },

      execute (req, res) {
        const id = req.params[this.controller.id];

        return BluebirdPromise.fromCallback (callback => {
          this.controller.bucket.delete (id, callback);
        }).then (() => {
          res.status (200).json (true);
        });
      }
    });
  },

  _onConnectionOpen () {
    let opts = {
      bucketName: this.name,
      chunkSizeBytes: this.chunkSizeBytes
    };

    if (this.writeConcern)
      opts.writeConcern = this.writeConcern;

    if (this.readPreference)
      opts.readPreference = this.readPreference;

    this._bucket = new GridFSBucket (this._connection.db, opts);

    this._appStart.signal ();
  }
});

/*
function GridFSController (conn, opts) {
  ResourceController.call (this, opts);

  this._resolveUser = opts.resolveUser;
  this._uploadPath = opts.uploadPath || path.resolve (blueprint.app.appPath, 'temp/uploads');
  this._upload = multer ({dest: this._uploadPath});

  let self = this;

  conn.on ('open', function () {
    let opts = { bucketName: self.name };
    self._bucket = new mongodb.GridFSBucket (conn.db, opts);
  });
}

GridFSController.prototype.create = function () {
  let self = this;

  return [
    this._upload.single (this.name),
    function (req, res) {
      // Store the content type.
      let opts = { contentType: req.file.mimetype};

      // Include the user that uploaded the file.
      let metadata = {};

      if (self._resolveUser)
        metadata.user = self._resolveUser (req);

      if (metadata.length !== 0)
        opts.metadata = metadata;

      // Create a new upload stream for the file.
      let uploadStream = self._bucket.openUploadStream (req.file.originalname, opts);

      fs.createReadStream (req.file.path)
        .pipe (uploadStream)
        .once ('error', function (err) {
          winston.log ('error', util.inspect (err));
          res.status (500).json ({error: 'Upload failed'});
        })
        .once ('finish', function () {
          res.status (200).json ({_id: uploadStream.id});
        });
    }
  ];
};

GridFSController.prototype.get = function () {
  let self = this;

  return {
    validate: {
      [this.id]: {
        in: 'params',
        isMongoId: { errorMessage: 'Invalid resource id' }
      }
    },

    sanitize: function (req, callback) {
      req.sanitizeParams (self.id).toMongoId ();
      return callback (null);
    },

    execute: function (req, res, callback) {
      let id = req.params[self.id];

      async.waterfall ([
        function (callback) {
          // Find information about the file.
          let cursor = self._bucket.find ({_id: id}, {limit: 1});

          cursor.next (function (err, item) {
            // Make sure we close the cursor.
            cursor.close ();

            if (err)
              return callback (err);

            if (!item)
              return callback (new HttpError (404, 'not_found', 'Resource does not exist'));

            return callback (null, item)
          });
        },

        function (file, callback) {
          // Download the file.
          let downloadStream = self._bucket.openDownloadStream (id);

          res.type (file.contentType);

          downloadStream
            .pipe (res)
            .once ('error', callback)
            .once ('finish', callback);
        }
      ], function (err) {
        if (err && !(err instanceof HttpError))
          err = new HttpError (500, 'Failed to retrieve file');

        if (err)
          return callback (err);

        return callback (null);
      });
    }
  };
};

GridFSController.prototype.delete = function () {
  let self = this;

  return {
    sanitize: function (req, callback) {
      try {
        let rcid = req.params[self.id];
        req.params[self.id] = new mongodb.ObjectId (rcid);

        return callback (null);
      }
      catch (e) {
        return callback (new HttpError (404));
      }
    },

    execute: function (req, res, callback) {
      let id = req.params[self.id];

      self._bucket.delete (id, function (err) {
        if (err) return res.status (500).json ({errors: 'Delete operation failed'});

        res.status (200).json (true);
        return callback (null);
      });
    }
  };
};

*/
