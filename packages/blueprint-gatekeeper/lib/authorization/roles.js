var async  = require ('async')
  ;

/**
 * Generic function that verifies that a single role in a list of current roles
 * is an authorized role from a list of authorized roles.
 *
 * @param authorizedRoles
 * @param currentRoles
 * @param callback
 */
function anyRole (authorizedRoles, currentRoles, callback) {
  async.some (currentRoles, function (currentRole, callback) {
    async.some (authorizedRoles, function (authorizedRole, callback) {
      callback (currentRole === authorizedRole);
    }, callback);
  }, callback);
}

exports.any = function (roles) {
  return function (req, res, next) {
    anyRole (roles, req.user.getRoles (), function (result) {
      if (result) return next ();

      res.status (403);
      return next (new Error ("Unauthorized access"));
    });
  }
};

