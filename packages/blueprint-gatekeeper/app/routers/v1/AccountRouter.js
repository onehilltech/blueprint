'use strict';

var gatekeeper = require ('../../../lib')
  ;

module.exports = {
  '/accounts' : {
    use: gatekeeper.protect (),

    resource: {
      controller: 'AccountController',
      deny: ['count']
    },

    '/:accountId': {
      '/password': {
        post: {action: 'AccountController@changePassword', policy: 'gatekeeper.account.isMe' }
      }
    }
  }
};
