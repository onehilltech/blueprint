'use strict';

var path    = require ('path')
  , multer  = require ('multer')
  ;

function Uploader (opts) {
  this._upload = multer (opts);
}

/**
 * Upload a single file.
 *
 * @param name
 * @param next
 * @returns {*[]}
 */
Uploader.prototype.singleFile = function (name, next) {
  return [
    this._upload.single (name),
    next
  ];
};

/**
 * Upload an array of multiple files.
 *
 * @param name
 * @param maxCount
 * @param next
 * @returns {*[]}
 */
Uploader.prototype.multipleFiles = function (name, maxCount, next) {
  return [
    this._upload.array (name, maxCount),
    next
  ];
};

module.exports = exports = Uploader;
