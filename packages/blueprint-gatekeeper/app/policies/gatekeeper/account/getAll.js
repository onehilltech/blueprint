const blueprint = require ('@onehilltech/blueprint')
  , Policy      = blueprint.Policy
;

module.exports = Policy.assert ('gatekeeper.request.scope', 'gatekeeper.account.get_all');
