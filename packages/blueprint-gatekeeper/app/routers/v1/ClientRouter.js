'use strict';

var passport = require ('passport')
  ;

module.exports = {
  '/clients': {
    use: passport.authenticate ('bearer', {session: false}),
    resource: {
      controller: 'ClientController',
      allow: ['create', 'update', 'delete']
    }
  }
};
