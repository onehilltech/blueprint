var gatekeeeper = require ('../../lib')
  ;

var has_role = require ('./has_role')
  ;

/**
 * Policy Description:
 *
 * Determine if the user that created the request is an administrator.
 */
module.exports = exports = function (req, callback) {
  return has_role (gatekeeeper.roles.user.administrator, req, callback);
};
