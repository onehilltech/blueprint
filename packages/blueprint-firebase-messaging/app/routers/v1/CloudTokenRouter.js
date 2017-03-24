var passport = require ('passport')
  ;

module.exports = exports = {
  '/cloudtoken' : {
    policy: 'gatekeeper.auth.bearer',

    resource: {
      controller : 'CloudTokenController',
      allow: ['create']
    }
  }
};
