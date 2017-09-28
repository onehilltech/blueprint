'use strict';

module.exports = {
  '/cloud-tokens' : {
    policy: 'gatekeeper.auth.bearer',

    post: 'CloudTokenController@registerToken',

    '/claims': {
      post: {action: 'CloudTokenController@claimDevice', policy: 'gatekeeper.request.isFromUser'},
    }
  }
};
