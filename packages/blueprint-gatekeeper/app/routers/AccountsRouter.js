var blueprint  = require ('@onehilltech/blueprint')
  , gatekeeper = require ('../../lib')
  ;

var passport  = blueprint.app.server.middleware.passport;
passport.use (gatekeeper.auth.bearer ());

module.exports = exports = {
  // Define the router properties.
  ':accountId'    : { property : 'accountId' },

  // Define the different account routes. We are going to protect all routes
  // under the /accounts base uri.
  '/accounts' : {
    use  : [
      passport.authenticate ('bearer', {session: false})
    ],

    get : { action : 'AccountController@getAccounts' },

    post: {
      before : [
        gatekeeper.authorization.isClient (),
        gatekeeper.authorization.roles.client ([gatekeeper.roles.client.account.create])
      ],
      action : 'AccountController@createAccount'
    }
  },

  '/accounts/:accountId': {
    get   : { action : 'AccountController@getAccount'},

    delete: {
      before : [
        gatekeeper.authorization.isClient (),
        gatekeeper.authorization.roles.client ([gatekeeper.roles.client.account.delete])
      ],
      action : 'AccountController@deleteAccount'
    }
  },

  '/accounts/:accountId/profile' : {
    get : { action : 'AccountController@getProfile' }
  },

  '/accounts/:accountId/enable' : {
    post : { action : 'AccountController@enableAccount' }
  },

  '/accounts/:accountId/roles' : {
    post : { action : 'AccountController@updateRoles' }
  },
};
