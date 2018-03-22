const {
  policies: {
    check
  }
} = require ('@onehilltech/blueprint');

module.exports = {
  '/helloworld' : {
    policy: check ('passthrough', true),

    get  : { view : 'helloworld.pug'},

    post : {
      policy: all ([
        check ('passthrough', true),
        check ('passthrough', false)
      ]),

      action : 'helloworld@echoName'
    },
  }
};
