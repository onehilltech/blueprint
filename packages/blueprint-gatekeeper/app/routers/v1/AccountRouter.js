var passport   = require ('passport')
  ;

module.exports = exports = {
  '/accounts' : {
    use: passport.authenticate ('bearer', {session: false}),
    resource: { controller: 'AccountController' }
  }
};
