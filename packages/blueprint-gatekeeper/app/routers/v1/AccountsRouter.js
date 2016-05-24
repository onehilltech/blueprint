var blueprint  = require ('@onehilltech/blueprint')
  , passport = require ('passport')
  , gatekeeper = require ('../../../lib')
  ;

passport.use (gatekeeper.auth.bearer ());

module.exports = exports = {
  // Define the router properties.
  ':accountId' : { property : 'accountId' },

  '/accounts' : {
    use: passport.authenticate ('bearer', {session: false}),
    resource: { id: ':accountId', controller: 'AccountController' }
  }

  /*
  // Define the different account routes. We are going to protect all routes
  // under the /accounts base uri.
  '/accounts' : {

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
  }*/
};
