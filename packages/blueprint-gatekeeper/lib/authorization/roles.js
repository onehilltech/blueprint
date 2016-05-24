var async  = require ('async')
  ;

/**
 * The implementation module.
 *
 * @type {{any}}
 */
var impl = (function () {
  return {
    any: function (authorizedRoles, currentRoles, callback) {
      async.some (currentRoles, function (currentRole, callback) {
        async.some (authorizedRoles, function (authorizedRole, callback) {
          callback (null, currentRole === authorizedRole);
        }, callback);
      }, callback);
    }
  }
})();

/**
 * Generic function that verifies that a single role in a list of current roles
 * is an authorized role from a list of authorized roles.
 *
 * @param authorizedRoles
 * @param currentRoles
 * @param callback
 */

exports.any = impl.any;

var middleware = {
  any: function (req, res, next) {
    return impl.any (roles, req.user.getRoles (), function (result) {
      if (result) return next ();

      res.status (403);
      return next (new Error ("Unauthorized access"));
    });
  }
};

exports.middleware = middleware;
