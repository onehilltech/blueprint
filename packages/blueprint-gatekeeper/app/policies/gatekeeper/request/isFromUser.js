'use strict';

module.exports = function (req, callback) {
  return callback (null, req.accessToken.kind === 'user_token', 'Not a user token');
};
