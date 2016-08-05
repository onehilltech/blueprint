var passport   = require ('passport')
  , blueprint  = require ('@onehilltech/blueprint')
  ;

module.exports = exports = {
  // Define the router properties.
  ':accountId' : { property : 'accountId' },

  '/accounts' : {
    use: passport.authenticate ('bearer', {session: false}),
    resource: { controller: 'AccountController' }
  }
};
