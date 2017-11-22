const async   = require ('async')
  , minimatch = require ('minimatch')
  ;

/**
 * Policy Description:
 *
 * Test if a request has the correct scope.
 */
module.exports = function (role, req, callback) {
  let {scope} = req;

  if (scope.length === 0)
    return callback (null, false, {reason: 'missing_scope', message: 'This request is missing a scope.'});

  async.some (scope, (pattern, callback) => {
    // The scope may have a pattern, but the role should not have a pattern.
    let match = minimatch (role, pattern);
    callback (null, match);
  }, (err, result) => {
    if (err || result)
      return callback (err, result);

    return callback (null, false, {reason: 'invalid_scope', message: 'This request does not have a valid scope.'});
  });
};

