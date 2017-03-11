'use strict';

var Policy     = require ('@onehilltech/blueprint').Policy
  , gatekeeper = require ('../../../lib')
  ;

module.exports = {
  '/accounts' : {
    use: gatekeeper.protect (),

    resource: {
      controller: 'AccountController',
      deny: ['count']
    }
  }
};
