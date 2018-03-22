const {
  policies: {
    check
  }
} = require ('@onehilltech/blueprint');

module.exports = {
  '/helloworld' : {
    policy: check ('identity', true),

    get  : { view : 'helloworld.pug'},

    post : {
      policy: check ('identity', false),
      action : 'helloworld@echoName'
    },
  }
};
