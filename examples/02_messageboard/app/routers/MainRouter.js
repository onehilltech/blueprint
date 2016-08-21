module.exports = exports = {
  '/messageboard' : {
    get  : { view : 'messageboard.pug' }
  },

  '/messages': {
    get  : { action : 'MessageController@getMessages' },
    post : { action : 'MessageController@postMessage' },

    '/:messageId': {
      get    : { action : 'MessageController@getMessage'},
      delete : { action : 'MessageController@deleteMessage' }
    }
  }
};
