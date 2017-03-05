'use strict';

var Policy     = require ('@onehilltech/blueprint').Policy
  , gatekeeper = require ('../../../lib')
  ;

module.exports = {
  '/accounts' : {
    use: gatekeeper.protect (),

    resource: {
      controller: 'AccountController',
      deny: ['count'],

      // The default policy for all actions on the resource controller.
      policy: Policy.assert ('gatekeeper.has_scope', gatekeeper.scope.superuser),

      // Define custom settings for the different actions, which includes overriding
      // the default policies on the resource controller.
      actions: {
        create: {
          policy: Policy.any ([
            Policy.assert ('gatekeeper.has_scope', gatekeeper.scope.superuser),
            Policy.assert ('gatekeeper.has_scope', gatekeeper.scope.account.create)
          ])
        },

        getOne: {
          policy: Policy.any ([
            Policy.assert ('gatekeeper.is_account_owner'),
            Policy.assert ('gatekeeper.has_scope', gatekeeper.scope.superuser)
          ])
        },

        update: {
          policy: Policy.any ([
            Policy.assert ('gatekeeper.is_account_owner'),
            Policy.assert ('gatekeeper.has_scope', gatekeeper.scope.superuser)
          ])
        },

        delete: {
          policy: Policy.any ([
            Policy.assert ('gatekeeper.is_account_owner'),
            Policy.assert ('gatekeeper.has_scope', gatekeeper.scope.superuser)
          ])
        }
      }
    }
  }
};
