module.exports = function (req, callback) {
  let accountId = req.params.accountId;
  let result = accountId.equals (req.user._id);

  return callback (null, result, {reason: 'invalid_account', message: 'You are not the account owner.'});
};
