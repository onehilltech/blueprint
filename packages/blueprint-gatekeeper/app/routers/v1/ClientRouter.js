'use strict';

var Policy     = require ('@onehilltech/blueprint').Policy
  , gatekeeper = require ('../../../lib')
  ;

module.exports = {
  '/clients': {
    use: gatekeeper.protect (),
    resource: {
      controller: 'ClientController',
      allow: ['create', 'update', 'delete']
    }
  }
};
