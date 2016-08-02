/**
 * Policy Description:
 *
 * This policy determines if an account has been activated.
 */
module.exports = exports = function (req, callback) {
  return callback (null, req.user.isActivated ());
};
