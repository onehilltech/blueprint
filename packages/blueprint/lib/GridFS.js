'use strict';

var fs      = require ('fs')
  , gridfs  = require ('gridfs-stream')
  , mongo   = require ('mongodb')
  , winston = require ('winston')
  ;

function GridFS (conn) {
  var self = this;

  conn.once ('open', function () {
    winston.log ('debug', 'initializing GridFS on connection');

    self._conn = conn;
    self._gridFS = gridfs (conn.db, mongo);
  });
}

/**
 * Write a file to the GridFS database.
 *
 * @param req
 * @param metadata
 * @param done
 */
GridFS.prototype.writeFileToDatabase = function (file, metadata, done) {
  if (typeof metadata === 'function') {
    done = metadata;
    metadata = {};
  }

  if (done === undefined)
    done = function (file) {};

  var opts = {
    content_type : file.mimetype,
    filename : file.originalname,
    metadata : metadata
  };

  var writeStream = this._gridFS.createWriteStream (opts);
  fs.createReadStream (file.path).pipe (writeStream);

  writeStream.on ('close', done);
};

/**
 * Read a file from the GridFS database.
 *
 * @param opts
 * @returns {Stream}
 */
GridFS.prototype.createReadStream = function (opts) {
  return this._gridFS.createReadStream (opts);
};

/**
 * Find metadata for a set of files.
 *
 * @param filter
 * @param options
 */
GridFS.prototype.find = function (filter, options) {
  this._gridFS.files.find (filter, options);
};

/**
 * Find the metadata for a single file.
 *
 * @param options
 * @param callback
 * @returns {Query|*|Promise}
 */
GridFS.prototype.findOne = function (options, callback) {
  return this._gridFS.findOne (options, callback);
};

exports = module.exports = GridFS;
