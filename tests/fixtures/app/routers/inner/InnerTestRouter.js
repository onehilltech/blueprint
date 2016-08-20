module.exports = exports = {
  ':param1': { action: 'inner.InnerTestController@lookupById' },

  '/helloworld2' : {
    get: { action: 'inner.InnerTestController@helloWorld' },

    '/inner2' : {
      get: { action: 'inner.InnerTestController@innerHelloWorld' }
    }
  }
};