'use strict';

var async = require ('async')
  ;

function hasScope (role, req, callback) {
  var scopes = req.authInfo.scope;

  if (scopes.length === 0)
    return callback (null, false, 'No scopes defined');

  async.some (scopes,
    function (scope, callback) {
      return callback (null, scope === role);
    },
    function (err, result) {
      if (err || result)
        return callback (err, result);

      return callback (null, false, 'Request does not have valid scope');
    });
}

module.exports = hasScope;
