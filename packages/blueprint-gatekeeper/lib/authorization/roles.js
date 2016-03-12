var async = require ('async')
  ;

/**
 * Generic function that verifies that a single role in a list of current roles
 * is an authorized role from a list of authorized roles.
 *
 * @param authorizedRoles
 * @param currentRoles
 * @param callback
 */
function checkRole (authorizedRoles, currentRoles, callback) {
  async.some (currentRoles, function (currentRole, callback) {
    async.some (authorizedRoles, function (authorizedRole, callback) {
      callback (currentRole === authorizedRole);
    }, callback);
  }, callback);
}

/**
 * Middleware to authorize client role access.
 *
 * @param authorizedRoles
 * @returns {Function}
 */
function authorizeClient (authorizedRoles) {
  return function (req, res, next) {
    var client = req.user;

    checkRole (authorizedRoles, client.roles, function (result) {
      if (result) return next ();

      res.status (403);
      return next (new Error ("Unauthorized access"));
    });
  }
}

/**
 * Middleware to authorize user role access.
 *
 * @param authorizedUserRoles
 * @param authorizedClientRoles
 * @returns {Function}
 */
function authorizeUser (authorizedUserRoles, authorizedClientRoles) {
  authorizedClientRoles = authorizedClientRoles || [];

  return function (req, res, next) {
    var user = req.user;

    checkRole (authorizedClientRoles, user.client.roles, function (err, result) {
      if (err) return next (err);

      if (!result) {
        res.status (403);
        return next (new Error ("Unauthorized access"));
      }

      checkRole (authorizedUserRoles, user.roles, function (err, result) {
        if (err) return next (err);

        if (!result) {
          res.status (403);
          return next (new Error ("Unauthorized access"));
        }

        // Move to the next function in the middleware.
        return next ();
      });

    });
  }
}

exports.client = authorizeClient;
exports.user = authorizeUser;
