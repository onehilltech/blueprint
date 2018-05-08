module.exports = {
  '/' : {
    get  : { view   : 'helloworld.pug' },
    post : { action : 'helloworld@echoName'},
  }
};
