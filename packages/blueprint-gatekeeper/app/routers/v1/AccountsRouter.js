var blueprint  = require ('@onehilltech/blueprint')
  , gatekeeper = require ('../../../lib/index')
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

    get : {
      // Only an administrator can access all the accounts on the system.
      before : [
        gatekeeper.authorization.roles.any ([gatekeeper.roles.user.administrator])
      ],
      action : 'AccountController@getAccounts'
    },

    post: {
      before : [
        gatekeeper.authorization.isClient (),
        gatekeeper.authorization.roles.any ([gatekeeper.roles.client.account.create])
      ],
      action : 'AccountController@createAccount'
    },

    '/:accountId' : {
      // Only an administrator can access the account information. The check
      // below applies to all paths that begin with this prefix.

      use : [
        gatekeeper.authorization.roles.any ([gatekeeper.roles.user.administrator])
      ],

      get : { action : 'AccountController@getAccount'},
      
      delete: {
        before : [
          gatekeeper.authorization.isClient (),
          gatekeeper.authorization.roles.any ([gatekeeper.roles.client.account.delete])
        ],
        action : 'AccountController@deleteAccount'
      },

      '/profile' : {
        get : { action : 'AccountController@getProfile' }
      },

      '/enable' : {
        post : { action : 'AccountController@enableAccount' }
      },

      '/roles' : {
        post : { action : 'AccountController@updateRoles' }
      }
    }
  }
};
