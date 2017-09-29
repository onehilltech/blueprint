'use strict';

module.exports = {
  '/cloud-tokens' : {
    policy: 'gatekeeper.auth.bearer',
    post: 'CloudTokenController@registerToken',

    '/:deviceId': {
      '/claim': {
        policy: 'gatekeeper.request.isFromUser',

        post: {action: 'CloudTokenController@claimDevice'},
        delete: {action: 'CloudTokenController@release'}
      }
    }
  }
};
