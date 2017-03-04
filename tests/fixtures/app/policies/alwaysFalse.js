'use strict';

module.exports = function alwaysFalse (req, callback) {
  return callback (null, false);
};
