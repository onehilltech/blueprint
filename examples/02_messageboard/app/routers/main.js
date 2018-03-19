module.exports = exports = {
  '/messageboard' : {
    get  : { view : 'messageboard.pug' }
  },

  '/messages': {
    get  : { action : 'message@getMessages' },
    post : { action : 'message@postMessage' },

    '/:messageId': {
      get    : { action : 'message@getMessage'},
      delete : { action : 'message@deleteMessage' }
    }
  }
};
