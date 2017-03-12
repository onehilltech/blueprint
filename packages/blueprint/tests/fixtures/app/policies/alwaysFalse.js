'use strict';

module.exports = function alwaysFalse (req, callback) {
  return callback (null, false, {reason: 'passthrough_failed', message: 'The pass through policy failed'});
};
