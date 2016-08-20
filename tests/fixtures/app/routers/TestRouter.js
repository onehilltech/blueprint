module.exports = exports = {
  ':param1': { action: 'TestController@lookupById' },

  '/helloworld': {
    get: { action: 'TestController@helloWorld', options: {debug: true} },

    '/inner': {
      get: { action: 'TestController@innerHelloWorld' }
    }
  },

  '/module': [ function (req, res) {} ]
};