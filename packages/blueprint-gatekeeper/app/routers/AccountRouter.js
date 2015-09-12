module.exports = exports = {
  ':accountId'    : { action : 'AccountController@lookupAccountByParam' },
  ':rawAccountId' : { property : 'rawAccountId' },

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

  '/accounts/:accountId/push-notifications/token' : {
    post : { action: 'AccountController@setPushNotificationToken'}
  }
};
