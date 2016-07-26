var Client = require ('../models/Client')
  ;


/**
 * Policy Description:
 *
 * This policy determine if the request is from a client.
 */
module.exports = exports = function (req, callback) {
  return callback (null, req.user.collection.collectionName === Client.collection.collectionName)
};
