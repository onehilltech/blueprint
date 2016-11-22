var async = require ('async')
  , blueprint = require ('@onehilltech/blueprint')
  , HttpError = blueprint.errors.HttpError
  ;

/**
 * Policy Description:
 *
 * Determine if the user has a least 1 role.
 */
module.exports = exports = function (role, req, callback) {
  if (!req.user)
    return callback (new HttpError (401, 'Unauthorized'));

  var scopes = req.authInfo.scope;

  if (scopes === '*')
    return callback (null, true);

  async.some (scopes,
    function (scope, callback) {
      // We are using async 1.5. This must change for async 2.0 to
      // callback (null, scope === role).
      return callback (null, scope === role);
    }, callback);
};
