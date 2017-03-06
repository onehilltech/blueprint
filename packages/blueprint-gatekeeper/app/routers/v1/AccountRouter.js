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

      // Define custom settings for the different actions, which includes overriding
      // the default policies on the resource controller.
      actions: {
        create: {
          policy: Policy.any ([
            Policy.assert ('gatekeeper.has_scope', gatekeeper.scope.account.create),
            Policy.assert ('gatekeeper.is_superuser')
          ])
        },

        getAll: {
          policy: Policy.assert ('gatekeeper.is_superuser')
        },

        getOne: {
          policy: Policy.any ([
            Policy.assert ('gatekeeper.is_account_owner'),
            Policy.assert ('gatekeeper.is_superuser')
          ])
        },

        update: {
          policy: Policy.any ([
            Policy.assert ('gatekeeper.is_account_owner'),
            Policy.assert ('gatekeeper.is_superuser')
          ])
        },

        delete: {
          policy: Policy.any ([
            Policy.assert ('gatekeeper.is_account_owner'),
            Policy.assert ('gatekeeper.is_superuser')
          ])
        }
      }
    }
  }
};
