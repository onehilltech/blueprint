var passport   = require ('passport')
  , blueprint  = require ('@onehilltech/blueprint')
  ;

module.exports = exports = {
  '/accounts' : {
    use: passport.authenticate ('bearer', {session: false}),
    resource: { controller: 'AccountController' }
  }
};
