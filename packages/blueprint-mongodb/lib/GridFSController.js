'use strict';

var util      = require ('util')
  , path      = require ('path')
  , blueprint = require ('@onehilltech/blueprint')
  , mongodb   = require ('mongodb')
  , multer    = require ('multer')
  , winston   = require ('winston')
  , async     = require ('async')
  , fs        = require ('fs')
  ;

var ResourceController = blueprint.ResourceController
  , HttpError = blueprint.HttpError
  ;

/**
 * Create a GridFSController object
 *
 * @param conn        Target connection for the controller
 * @param opts        Options for the controller
 * @constructor
 */
function GridFSController (conn, opts) {
  ResourceController.call (this, opts);

  this._resolveUser = opts.resolveUser;
  this._uploadPath = opts.uploadPath || path.resolve (blueprint.app.appPath, 'temp/uploads');
  this._upload = multer ({dest: this._uploadPath});

  var self = this;

  conn.on ('open', function () {
    var opts = { bucketName: self.name };
    self._bucket = new mongodb.GridFSBucket (conn.db, opts);
  });
}

util.inherits (GridFSController, ResourceController);

module.exports = GridFSController;

/**
 * Upload a new file to the database.
 *
 * @returns {*[]}
 */
GridFSController.prototype.create = function () {
  var self = this;

  return [
    this._upload.single (this.name),
    function (req, res) {
      // Store the content type.
      var opts = { contentType: req.file.mimetype};

      // Include the user that uploaded the file.
      var metadata = {};

      if (self._resolveUser)
        metadata.user = self._resolveUser (req);

      if (metadata.length !== 0)
        opts.metadata = metadata;

      // Create a new upload stream for the file.
      var uploadStream = self._bucket.openUploadStream (req.file.originalname, opts);

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

/**
 * Disallow getting all the files. You can only get a single file at a time.
 *
 * @param opts
 * @returns {Function}
 */
GridFSController.prototype.getAll = function () {
  return function (req, res) {
    return res.sendStatus (404);
  }
};

/**
 * Get a single file.
 *
 * @param opts
 */
GridFSController.prototype.get = function () {
  var self = this;

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
          var downloadStream = self._bucket.openDownloadStream (id);

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

/**
 * Update a file.
 *
 * @returns {*[]}
 */
GridFSController.prototype.update = function () {
  return function (req, res) {
    res.sendStatus (404);
  };
};

/**
 * Delete a single file.
 *
 * @returns {Function}
 */
GridFSController.prototype.delete = function () {
  var self = this;

  return {
    sanitize: function (req, callback) {
      try {
        var rcid = req.params[self.id];
        req.params[self.id] = new mongodb.ObjectId (rcid);

        return callback (null);
      }
      catch (e) {
        return callback (new HttpError (404));
      }
    },

    execute: function (req, res, callback) {
      var id = req.params[self.id];

      self._bucket.delete (id, function (err) {
        if (err) return res.status (500).json ({errors: 'Delete operation failed'});

        res.status (200).json (true);
        return callback (null);
      });
    }
  };
};

/**
 * Count the number of resources.
 *
 * @returns {*[]}
 */
GridFSController.prototype.count = function () {
  return function (req, res) {
    res.sendStatus (404);
  };
};
