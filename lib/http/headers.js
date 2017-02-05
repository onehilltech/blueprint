'use strict';

var exports = module.exports = {};

exports.LAST_MODIFIED = 'Last-Modified';
exports.IF_MODIFIED_SINCE = 'If-Modified-Since';
exports.IF_UNMODIFIED_SINCE = 'If-Unmodified-Since';
exports.ETAG = 'ETag';

exports.lowercase = {
  LAST_MODIFIED: exports.LAST_MODIFIED.toLowerCase (),
  IF_MODIFIED_SINCE: exports.IF_MODIFIED_SINCE.toLowerCase (),
  IF_UNMODIFIED_SINCE: exports.IF_UNMODIFIED_SINCE.toLowerCase (),
  ETAG: exports.ETAG.toLowerCase ()
};
