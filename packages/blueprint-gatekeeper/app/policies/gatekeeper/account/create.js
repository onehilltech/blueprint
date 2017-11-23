const blueprint = require ('@onehilltech/blueprint')
  , Policy      = blueprint.Policy
  ;

module.exports = Policy.all ([
  Policy.assert ('gatekeeper.request.scope', 'gatekeeper.account.create'),

  /*
   * Check the password policy. The password policy is optional. If an application
   * wants to enable password policies, then they just need to overload this policy
   * in their application.
   */
  Policy.assert ('?gatekeeper.account.password')
]);


