module.exports = exports = {
  ':param1': { action: 'TestController@lookupById' },

  '/helloworld': {
    get: { action: 'TestController@helloWorld', options: {debug: true}},

    '/inner': {
      get: { action: 'TestController@innerHelloWorld' }
    }
  },

  '/policies': {
    '/accepted': {
      policy: 'alwaysTrue',
      get: 'TestController@helloWorld'
    },

    '/rejected': {
      policy: 'alwaysFalse',
      get: 'TestController@helloWorld'
    },

    '/methods': {
      '/rejected': {
        get: {action: 'TestController@helloWorld', policy: 'alwaysFalse'}
      }
    }
  },

  '/module': [ function (req, res) {} ]
};