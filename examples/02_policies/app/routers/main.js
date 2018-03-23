const {
  policies: { check, all, any }
} = require ('@onehilltech/blueprint');

module.exports = {
  '/helloworld' : {
    policy: check ('identity', true),

    get  : { view : 'helloworld.pug'},

    post : {
      policy: all ([
        check ('identity', true),
        check ('identity', false)
      ]),

      action : 'helloworld@echoName'
    },

    '/negate': {
      get: {
        policy: check ('!identity', false),
        view: 'helloworld.pug'
      }
    },

    '/optional': {
      get: {
        policy: check ('?missing', false),
        view: 'helloworld.pug'
      }
    },

    '/any': {
      get: {
        policy: any ([
          check ('identity', false),
          check ('identity', false)
        ]),
        view: 'helloworld.pug'
      }
    }

  }
};
