var passport   = require ('passport')
  , blueprint  = require ('@onehilltech/blueprint')
  , messaging  = blueprint.messaging
  , gatekeeper = require ('../../../lib')
  ;

var tokenStrategy;

messaging.on ('app.init', function (app) {
  var config = app.configs.gatekeeper;
  tokenStrategy = gatekeeper.tokens (config.token);

  passport.use (gatekeeper.auth.bearer ({ tokenStrategy: tokenStrategy }));
});

module.exports = exports = {
  // Define the router properties.
  ':accountId' : { property : 'accountId' },

  '/accounts' : {
    use: passport.authenticate ('bearer', {session: false}),
    resource: { controller: 'AccountController' }
  }
};
