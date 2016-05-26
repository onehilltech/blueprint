var Account = require ('../../app/models/Account')
  , Client  = require ('../../app/models/Client')
  ;

/**
 * Middleware to test if the current user is an account.
 */
function isAccount () {
  return function (req, res, next) {
    if (req.user.collection.collectionName === Account.collection.collectionName)
      return next ();

    res.status (403);
    return next (new Error ('Account access only'))
  };
}

/**
 * Middleware to test if the current user is a client.
 *
 * @returns {Function}
 */
function isClient () {
  return function (req, res, next) {
    if (req.user.collection.collectionName === Client.collection.collectionName)
      return next ();

    res.status (403);
    return next (new Error ('Client access only'))
  };
}

exports.roles = require ('./roles');
exports.checks = require ('./checks');

exports.isClient = isClient;
exports.isAccount = isAccount;
