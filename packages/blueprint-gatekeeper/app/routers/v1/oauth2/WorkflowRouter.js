var blueprint = require ('@onehilltech/blueprint')
  , passport = require ('passport')
  , auth = require ('../../../../lib/authentication')
  ;

passport.use (auth.bearer ());

module.exports = exports = {
  '/token': {
    post: { action: 'oauth2.WorkflowController@issueToken' }
  },

  '/logout' : {
    use: passport.authenticate ('bearer', {session: false}),
    get: { action : 'oauth2.WorkflowController@logoutUser' }
  }
};
