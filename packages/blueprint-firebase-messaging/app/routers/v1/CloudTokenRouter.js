'use strict';

module.exports = {
  '/cloud-tokens' : {
    policy: 'gatekeeper.auth.bearer',

    post: 'CloudTokenController@registerToken',

    '/:deviceId': {
      put: {action: 'CloudTokenController@claimToken', policy: 'gatekeeper.request.isFromUser'}
    }
  }
};
