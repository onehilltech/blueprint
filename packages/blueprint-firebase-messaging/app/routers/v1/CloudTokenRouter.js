'use strict';

module.exports = {
  '/cloud-tokens' : {
    policy: 'gatekeeper.auth.bearer',

    post: 'CloudTokenController@registerToken',

    '/:deviceId': {
      get: {action: 'CloudTokenController@claimDevice', policy: 'gatekeeper.request.isFromUser'},
    }
  }
};
