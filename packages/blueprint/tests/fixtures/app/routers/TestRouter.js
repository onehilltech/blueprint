module.exports = exports = {
  ':param1': { property: 'param1' },
  ':param2': { property: 'param2' },

  '/helloworld': {
    get: { action: 'TestController@helloWorld', options: {debug: true} },

    '/inner': {
      get: { action: 'TestController@innerHelloWorld' }
    },

    '/:param3': {
      get: { action: 'TestController@getWithId' }
    }
  },

  '/module': [ function (req, res) {} ]
};