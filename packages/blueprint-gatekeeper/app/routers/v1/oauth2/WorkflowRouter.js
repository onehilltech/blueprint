var blueprint  = require ('@onehilltech/blueprint')
  , messaging  = blueprint.messaging
  , passport   = require ('passport')
  , gatekeeper = require ('../../../../lib')
  ;

var tokenStrategy;

messaging.on ('app.init', function (app) {
  var config = app.configs.gatekeeper;
  tokenStrategy = gatekeeper.tokens (config.token);

  passport.use (gatekeeper.auth.bearer ({ tokenStrategy: tokenStrategy }));
});

module.exports = exports = {
  '/token': {
    post: { action: 'oauth2.WorkflowController@issueToken' }
  },

  '/logout' : {
    use: passport.authenticate ('bearer', {session: false}),
    get: { action : 'oauth2.WorkflowController@logoutUser' }
  }
};
