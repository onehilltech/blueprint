'use strict';

/**
 * Check the policy of a native client. The native client is expected to have a
 * client secret.
 *
 * @param req
 * @param callback
 * @returns {*}
 */
module.exports = function (req, callback) {
  const clientSecret = req.body.client_secret;
  const correct = clientSecret === req.client.client_secret;

  return callback (null, correct, {reason: 'incorrect_secret', message: 'Incorrect client secret'});
};
