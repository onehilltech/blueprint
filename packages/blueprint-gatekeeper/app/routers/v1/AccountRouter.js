'use strict';

module.exports = {
  '/accounts' : {
    policy: 'gatekeeper.auth.bearer',

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
