module.exports = exports = {
  ':param1' : { property: 'param1' },
  ':param2' : { property: 'param2' },

  use: [ function routerUse (req, res, next) { }],

  '/helloworld' : {
    use: [ function outerUse (req, res, next) { }],

    get: { action: 'TestController@helloWorld' },

    '/inner' : {
      use: [ function innerUse (req, res, next) { }],
      get: { action: 'TestController@innerHelloWorld' }
    }
  }
};