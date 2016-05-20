module.exports = exports = {
  ':param1' : { property: 'param1' },
  ':param2' : { property: 'param2' },

  '/helloworld2' : {
    get: { action: 'inner.InnerTestController@helloWorld' },

    '/inner2' : {
      get: { action: 'inner.InnerTestController@innerHelloWorld' }
    }
  }
};