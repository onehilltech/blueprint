var async = require ('async')
  ;

/**
 * Policy Description:
 *
 * Determine if the user has a least 1 role.
 */
module.exports = exports = function (role, req, callback) {
  var scopes = req.authInfo.scope;

  async.some (scopes,
    function (scope, callback) {
      // We are using async 1.5. This must change for async 2.0 to
      // callback (null, scope === role).
      return callback (scope === role);
    },
    function (result) {
      return callback (null, result);
    });
};
