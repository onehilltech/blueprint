'use strict';

module.exports = {
  '/cloud-tokens' : {
    policy: 'gatekeeper.auth.bearer',

    resource: {
      controller : 'CloudTokenController',
      allow: ['create']
    }
  }
};
