'use strict';

module.exports = function (req, callback) {
  return callback (null, req.accessToken.kind === 'client_token', 'Not a client token');
};
