'use strict';

module.exports = function isAccountOwner (req, callback) {
  var accountId = req.params.accountId;
  return callback (null, accountId === req.user.id || accountId === 'me');
};
