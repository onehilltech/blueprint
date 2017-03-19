'use strict';

module.exports = function (req, callback) {
  var accountId = req.params.accountId;
  var result = accountId.equals (req.user._id) || accountId === 'me';

  return callback (null, result, 'Not the account owner');
};
