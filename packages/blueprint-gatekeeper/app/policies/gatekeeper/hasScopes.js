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
  var actual = req.authInfo.scope;

  async.every (expected,
    function (role, callback) {
      async.some (actual,
        function (scope, callback) {
          return callback (null, scope === role);
        },
        callback);
    },
    function (err, result) {
      if (err || result)
        return callback (err, result);

      return callback (null, false, 'Request does not have valid scope');
    });
};
