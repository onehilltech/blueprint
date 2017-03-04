'use strict';

module.exports = function alwaysTrue (req, callback) {
  return callback (null, true);
};
