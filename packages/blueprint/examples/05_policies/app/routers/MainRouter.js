module.exports = exports = {
  '/helloworld' : {
    get  : { view   : 'helloworld' },
    post : { action : 'HelloWorldController@echoName'},
  }
};
