var xpression = require ('xpression')
  , auth      = require ('../../lib').auth
  ;

var passport  = xpression.app.server.middleware.passport;
passport.use (auth.bearer ());

module.exports = exports = {
  '/oauth2/token' : {
    post : { action : 'Oauth2Controller@getToken' },
  },

  '/oauth2/logout' : {
    use  : [
      passport.authenticate ('bearer', {session: false})
    ],

    get  : { action : 'Oauth2Controller@logoutUser' }
  }
};
