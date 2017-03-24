'use strict';

module.exports = {
  '/cloudtoken' : {
    policy: 'gatekeeper.auth.bearer',

    resource: {
      controller : 'CloudTokenController',
      allow: ['create']
    }
  }
};
