var async = require ('async')
  ;

/**
 * Policy Description:
 *
 * Determine if the user has a least 1 role.
 */
module.exports = exports = function (role, req, callback) {
  var userRoles = req.user.roles;

  async.some (userRoles,
    function (userRole, callback) {
      // We are using async 1.5. This must change for async 2.0 to
      // callback (null, userRole === role).
      return callback (userRole === role);
    },
    function (result) {
      return callback (null, result);
    });
};
