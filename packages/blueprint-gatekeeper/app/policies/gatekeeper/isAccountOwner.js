'use strict';

module.exports = function isAccountOwner (req, callback) {
  var accountId = req.params.accountId;
  var result = accountId.equals (req.user._id);

  return callback (null, result, 'Not the account owner');
};
