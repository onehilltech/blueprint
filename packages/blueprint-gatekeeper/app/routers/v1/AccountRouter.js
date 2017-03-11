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
        getAll: {
          policy: Policy.assert ('gatekeeper.isSuperUser')
        },

        getOne: {
          policy: Policy.any ([
            Policy.assert ('gatekeeper.isAccountOwner'),
            Policy.assert ('gatekeeper.isSuperUser')
          ])
        },

        update: {
          policy: Policy.any ([
            Policy.assert ('gatekeeper.isAccountOwner'),
            Policy.assert ('gatekeeper.isSuperUser')
          ])
        },

        delete: {
          policy: Policy.any ([
            Policy.assert ('gatekeeper.isAccountOwner'),
            Policy.assert ('gatekeeper.isSuperUser')
          ])
        }
      }
    }
  }
};
