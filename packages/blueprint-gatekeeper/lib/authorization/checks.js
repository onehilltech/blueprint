var async = require ('async')
  , roles = require ('../roles/user')
  ;

/**
 * Check if the current request is from a client.
 *
 * @param req
 * @param callback
 * @returns {*}
 */
exports.isClient = function isClient (req, callback) {
  return callback (null, req.user.collection.collectionName === Client.collection.collectionName);
};

/**
 * Check if the current request is from an administrator.
 *
 * @param req
 * @param callback
 */
exports.isAdministrator = function isAdministrator (req, callback) {
  async.some (req.user.getRoles (),
    function (role, callback) {
      return callback (role === roles.administrator);
    },
    function (result) {
      return callback (null, result);
    });
};
