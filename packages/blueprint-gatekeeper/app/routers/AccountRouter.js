var blueprint = require ('blueprint')
  , auth      = require ('../../lib').auth
  ;

var passport  = blueprint.app.server.middleware.passport;
passport.use (auth.bearer ());

module.exports = exports = {
  // Define the router properties.
  ':accountId'    : { action : 'AccountController@lookupAccountByParam' },
  ':rawAccountId' : { property : 'rawAccountId' },


  // Define the different account routes. We are going to protect all routes
  // under the /accounts base uri.
  '/accounts' : {
    use  : [
      passport.authenticate ('bearer', {session: false})
    ],

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

  '/accounts/:accountId/apn' : {
    post : { action: 'AccountController@setPushNotificationToken'}
  }
};
