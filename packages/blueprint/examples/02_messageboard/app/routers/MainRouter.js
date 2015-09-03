module.exports = exports = {
  ':messageId' : { property : 'messageId'},

  '/messageboard' : {
    get  : { view : 'messageboard' }
  },

  '/messages' : {
    get  : { action : 'MessageController@getMessages' },
    post : { action : 'MessageController@postMessage' },
  },

  '/messages/:messageId' : {
    get    : { action : 'MessageController@getMessage'},
    delete : { action : 'MessageController@deleteMessage' }
  }
};
