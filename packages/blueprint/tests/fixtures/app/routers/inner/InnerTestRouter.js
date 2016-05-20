module.exports = exports = {
  ':param1' : { property: 'param1' },
  ':param2' : { property: 'param2' },

  '/helloworld2' : {
    get: { action: 'TestController@helloWorld' },

    '/inner2' : {
      get: { action: 'TestController@innerHelloWorld' }
    }
  }
};