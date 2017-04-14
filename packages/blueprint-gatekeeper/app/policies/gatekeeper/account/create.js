'use strict';

var blueprint  = require ('@onehilltech/blueprint')
  , Policy     = blueprint.Policy
  , gatekeeper = require ('../../../../lib')
  ;

module.exports = Policy.all ([
  /*
   * Check the scope of the requester
   */
  Policy.any ([
    Policy.assert ('gatekeeper.request.hasScope', gatekeeper.scope.account.create),
    Policy.assert ('gatekeeper.isSuperUser')
  ]),

  /*
   * Check the password policy. The password policy is optional. If an application
   * wants to enable password policies, then they just need to overload this policy
   * in their application.
   */
  Policy.assert ('?gatekeeper.account.password')
]);


