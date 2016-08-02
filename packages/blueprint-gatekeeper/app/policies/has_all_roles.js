var async = require ('async')
  ;

/**
 * Policy Description:
 *
 * Determine if the user supports all roles specified.
 */
module.exports = exports = function (roles, req, callback) {
  var userRoles = req.user.roles;

  async.every (roles, function (role, callback) {
    async.some (userRoles, function (aRole, callback) {
      // We are using async 1.5. This must change for async 2.0 to
      // callback (null, userRole === role).
      return callback (aRole === role);
    }, callback);
  }, function (result) {
    return callback (null, result);
  });
};
