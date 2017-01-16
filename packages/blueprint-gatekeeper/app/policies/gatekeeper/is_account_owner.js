/**
 * Policy Description:
 *
 * This policy determine if the request is from a client.
 */
module.exports = exports = function (req, callback) {
  var accountId = req.params.accountId;
  return callback (null, accountId === req.user.id || accountId === 'me');
};
