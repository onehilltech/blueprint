var blueprint  = require ('@onehilltech/blueprint')
  , passport = require ('passport')
  , gatekeeper = require ('../../../lib')
  ;

passport.use (gatekeeper.auth.bearer ());

module.exports = exports = {
  // Define the router properties.
  ':accountId' : { property : 'accountId' },

  '/accounts' : {
    use: passport.authenticate ('bearer', {session: false}),
    resource: { id: ':accountId', controller: 'AccountController' }
  }
};
