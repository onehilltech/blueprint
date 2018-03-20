module.exports = {
  '/helloworld' : {
    policy: ['passthrough', true],

    get  : { view : 'helloworld.pug'},

    post : {
      policy : ['passthrough', false],
      action : 'helloworld@echoName'
    },
  }
};
