var async = require ('async')
  , blueprint = require ('@onehilltech/blueprint')
  , HttpError = blueprint.errors.HttpError
  ;

/**
 * Policy Description:
 *
 * Determine if the user supports all roles specified.
 */
module.exports = exports = function (expected, req, callback) {
  if (!req.user)
    return callback (new HttpError (401, 'Unauthorized'));

  var actual = req.authInfo.scope;

  if (actual === '*')
    return callback (null, true);

  async.every (expected, function (role, callback) {
    async.some (actual, function (scope, callback) {
      // We are using async 1.5. This must change for async 2.0 to
      // callback (null, userRole === role).
      return callback (scope === role);
    }, callback);
  }, function (result) {
    return callback (null, result);
  });
};
