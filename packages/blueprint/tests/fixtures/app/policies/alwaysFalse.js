'use strict';

module.exports = function alwaysFalse (req, callback) {
  return callback (null, false, {code: 'passthrough_failed', message: 'The pass through policy failed'});
};
