var blueprint = require ('blueprint')
  , auth      = require ('../../lib').auth
  ;

var passport  = blueprint.app.server.middleware.passport;
passport.use (auth.bearer ());

module.exports = exports = {
  // Define the router properties.
  ':accountId'    : { action : 'AccountController@lookupAccountByParam' },
  ':rawAccountId' : { property : 'rawAccountId' },

  // Define global middleware.
  /*
  use  : [
    passport.authenticate ('bearer', {session: false})
  ],*/

  // Define the different routes for the router.
  '/accounts' : {
    get : {action: 'AccountController@getAccounts'},
    post: {action: 'AccountController@createAccount'}
  },

  '/accounts/:rawAccountId': {
    get   : {action: 'AccountController@getAccount'},
    delete: {action: 'AccountController@deleteAccount'}
  },

  '/accounts/:accountId/enable' : {
    post : { action: 'AccountController@enableAccount'}
  },

  '/accounts/:accountId/roles' : {
    post : { action: 'AccountController@updateRoles'}
  },

  '/accounts/:accountId/apn/token' : {
    post : { action: 'AccountController@setPushNotificationToken'}
  }
};
