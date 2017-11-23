const blueprint = require ('@onehilltech/blueprint')
  , Policy      = blueprint.Policy
  ;

module.exports = Policy.any ([
  Policy.assert ('gatekeeper.account.me'),
  Policy.assert ('gatekeeper.request.scope', 'gatekeeper.account.get_all'),
]);
