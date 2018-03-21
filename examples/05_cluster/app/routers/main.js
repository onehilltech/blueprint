module.exports = exports = {
  '/helloworld' : {
    get  : { view   : 'helloworld.pug' },
    post : { action : 'helloworld@echoName'},
  }
};
