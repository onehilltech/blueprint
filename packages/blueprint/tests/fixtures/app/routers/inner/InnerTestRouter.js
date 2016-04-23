module.exports = exports = {
  ':param1' : { property: 'param1' },
  ':param2' : { property: 'param2' },

  use: [ function routerUse (req, res, next) { }],

  '/helloworld2' : {
    use: [ function outerUse (req, res, next) { }],

    get: { action: 'TestController@helloWorld' },

    '/inner2' : {
      use: [ function innerUse (req, res, next) { }],
      get: { action: 'TestController@innerHelloWorld' }
    }
  }
};