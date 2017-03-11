'use strict';

var gatekeeper = require ('../../../lib')
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
