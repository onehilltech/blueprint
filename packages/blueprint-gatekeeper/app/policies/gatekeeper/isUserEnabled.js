'use strict';

module.exports = exports = function (req, callback) {
  return callback (null, req.user.enabled);
};
