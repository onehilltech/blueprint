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

GridFS.prototype.createReadStream = function (opts) {
  return this._gridFS.createReadStream (opts);
};

exports = module.exports = GridFS;
