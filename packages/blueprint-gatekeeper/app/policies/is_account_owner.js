/**
 * Policy Description:
 *
 * This policy determine if the request is from a client.
 */
module.exports = exports = function (req, callback) {
  return callback (null, req.params.accountId === req.user.id || req.params.accountId === 'me');
};
