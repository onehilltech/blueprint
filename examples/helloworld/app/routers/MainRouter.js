module.exports = exports = {
  ':testParam' : 'HelloWorldController@lookupParam',

  '/helloworld' : {
    get  : { view   : 'helloworld' },
    post : { action : 'HelloWorldController@echoName'},
  }
};


