var async = require ('async')
  ;

module.exports = function hasScope (role, req, callback) {
  var scopes = req.authInfo.scope;

  if (scopes.length === 0)
    return callback (null, false);

  async.some (scopes,
    function (scope, callback) {
      return callback (null, scope === role);
    }, callback);
};
