module.exports = exports = {
  '/messageboard' : {
    get  : { view : 'messageboard.pug' }
  },

  '/messages': {
    resource: {
      controller: 'MessageController',
      deny: ['update']
    }
  }
};
