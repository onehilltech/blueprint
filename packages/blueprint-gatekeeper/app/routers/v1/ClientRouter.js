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
            Policy.assert ('gatekeeper.has_scope', gatekeeper.scope.client.create),
            Policy.assert ('gatekeeper.has_scope', gatekeeper.scope.superuser)
          ])
        },

        update: {
          policy: Policy.any ([
            Policy.assert ('gatekeeper.has_scope', gatekeeper.scope.client.update),
            Policy.assert ('gatekeeper.has_scope', gatekeeper.scope.superuser)
          ])
        },

        delete: {
          policy: Policy.any ([
            Policy.assert ('gatekeeper.has_scope', gatekeeper.scope.client.delete),
            Policy.assert ('gatekeeper.has_scope', gatekeeper.scope.superuser)
          ])
        }
      }
    }
  }
};
