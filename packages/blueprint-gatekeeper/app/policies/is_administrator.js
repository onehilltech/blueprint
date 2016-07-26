var async = require ('async')
  , roles = require ('../../lib/roles').user
  ;

var has_role = require ('./has_role')
  ;

/**
 * Policy Description:
 *
 * Determine if the user that created the request is an administrator.
 */
module.exports = exports = function (req, callback) {
  return has_role (roles.administrator, req, callback);
};
