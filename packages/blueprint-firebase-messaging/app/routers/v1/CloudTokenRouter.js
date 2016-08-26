var passport = require ('passport')
  ;

module.exports = exports = {
  '/cloudtoken' : {
    use: passport.authenticate ('bearer', {session: false}),
    resource: {
      controller : 'CloudTokenController',
      allow: ['create']
    }
  }
};
