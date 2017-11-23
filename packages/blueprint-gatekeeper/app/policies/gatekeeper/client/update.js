const blueprint = require ('@onehilltech/blueprint')
  , Policy      = blueprint.Policy
  ;

module.exports = Policy.assert ('gatekeeper.request.scope', 'gatekeeper.client.update');
