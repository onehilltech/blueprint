/**
 * Middleware to test if the current user is a client.
 *
 * @returns {Function}
 */
function isClient () {
  return function (req, res, next) {
    if (req.user.secret !== undefined)
      return next ();

    res.status (403);
    return next (new Error ('Client access only'))
  };
}

exports.roles = require ('./roles');
exports.isClient = isClient;
