'use strict';

var blueprint  = require ('@onehilltech/blueprint')
  , Policy     = blueprint.Policy
  , gatekeeper = require ('../../../../lib')
  ;

module.exports = Policy.any ([
  Policy.assert ('gatekeeper.hasScope', gatekeeper.scope.client.delete),
  Policy.assert ('gatekeeper.isSuperUser')
]);
