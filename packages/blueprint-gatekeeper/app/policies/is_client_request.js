var blueprint = require ('@onehilltech/blueprint')
  , messaging = blueprint.messaging
  ;

var Client;

messaging.on ('app.init', function (app) {
  Client = app.models.Client;

  if (!Client)
    throw new Error ('Client model not initialized');
});

/**
 * Policy Description:
 *
 * This policy determine if the request is from a client.
 */
module.exports = exports = function (req, callback) {
  return callback (null, req.authInfo.scope === 'client');
};
