module.exports = exports = {
  ':imageId' : { property : 'imageId'},

  '/helloworld' : {
    get  : { view   : 'helloworld' },
    post : { action : 'HelloWorldController@uploadImage'},
  },

  '/helloworld/images/:imageId' : {
    get : { action : 'HelloWorldController@getImage' }
  }
};
