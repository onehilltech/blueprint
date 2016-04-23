var blueprint = require ('@onehilltech/blueprint')
  , auth      = require ('../../../lib/index').auth
  ;

var passport  = blueprint.app.server.middleware.passport;
passport.use (auth.bearer ());

module.exports = exports = {
  '/oauth2': {
    '/token': {
      post: { action: 'Oauth2Controller@getToken' },
    },

    '/logout' : {
      use: [
        passport.authenticate ('bearer', {session: false})
      ],

      get: { action : 'Oauth2Controller@logoutUser' }
    }
  }
};
