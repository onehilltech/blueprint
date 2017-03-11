'use strict';

var gatekeeper = require ('../../../lib')
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
