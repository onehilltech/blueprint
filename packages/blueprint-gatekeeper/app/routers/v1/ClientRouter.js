'use strict';

var Policy     = require ('@onehilltech/blueprint').Policy
  , gatekeeper = require ('../../../lib')
  ;

module.exports = {
  '/clients': {
    use: gatekeeper.protect (),
    resource: {
      controller: 'ClientController',
      allow: ['create', 'update', 'delete'],

      actions: {
        create: {
          policy: Policy.any ([
            Policy.assert ('gatekeeper.hasScope', gatekeeper.scope.client.create),
            Policy.assert ('gatekeeper.isSuperUser')
          ])
        },

        update: {
          policy: Policy.any ([
            Policy.assert ('gatekeeper.hasScope', gatekeeper.scope.client.update),
            Policy.assert ('gatekeeper.isSuperUser')
          ])
        },

        delete: {
          policy: Policy.any ([
            Policy.assert ('gatekeeper.hasScope', gatekeeper.scope.client.delete),
            Policy.assert ('gatekeeper.isSuperUser')
          ])
        }
      }
    }
  }
};
