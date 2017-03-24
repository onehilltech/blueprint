'use strict';

const async = require ('async')
  ;

/**
 * Policy Description:
 *
 * Determine if the user supports all roles specified.
 */
module.exports = exports = function (expected, req, callback) {
  var actual = req.scope;

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
