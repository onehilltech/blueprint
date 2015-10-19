var xpression = require ('xpression')
  , auth      = require ('../../lib').auth
  ;

var passport  = xpression.app.server.middleware.passport;
passport.use (auth.bearer ());

module.exports = exports = {
  // Define the different account routes. We are going to protect all routes
  // under the /accounts base uri.
  '/me/notifications': {
    post : {action: 'MeController@setPushNotificationToken'},
  },
};
