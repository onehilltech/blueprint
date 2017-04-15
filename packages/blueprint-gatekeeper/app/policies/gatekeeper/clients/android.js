'use strict';

const blueprint = require ('@onehilltech/blueprint')
  , Policy      = blueprint.Policy
  ;

/**
 * Check the policy of a native client. The native client is expected to have a
 * client secret.
 *
 * @param req
 * @param callback
 * @returns {*}
 */
module.exports = Policy.all ([
  Policy.check ('gatekeeper.clients.native'),

  function (req, callback) {
    const correct = req.body.package === req.client.package;
    return callback (null, correct, {reason: 'incorrect_package', message: 'Incorrect Android package'});
  }
]);
