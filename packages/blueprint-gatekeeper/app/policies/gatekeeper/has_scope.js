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
  var scopes = req.authInfo.scope;

  async.some (scopes,
    function (scope, callback) {
      return callback (null, scope === role);
    }, callback);
};
