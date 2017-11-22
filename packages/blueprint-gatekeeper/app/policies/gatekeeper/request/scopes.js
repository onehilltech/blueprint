const async   = require ('async')
  , minimatch = require ('minimatch')
  ;

/**
 * Policy Description:
 *
 * Test if a request has a set of expected scopes.
 */
module.exports = function (expected, req, callback) {
  let actual = req.scope;

  async.every (expected,
    (role, callback) => {
      async.some (actual, (scopePattern, callback) => {
        let match = minimatch (role, scopePattern);
        callback (null, match);
      }, callback);
    }, (err, result) => {
      if (err || result)
        return callback (err, result);

      return callback (null, false, {reason: 'invalid_scope', message: 'This request does not have a valid scope.'});
    });
};
