'use strict';

var gatekeeper = require ('../../../lib')
  ;

module.exports = {
  '/clients': {
    policy: 'gatekeeper.auth.bearer',
    resource: {
      controller: 'ClientController',
      allow: ['create', 'update', 'delete']
    }
  }
};
