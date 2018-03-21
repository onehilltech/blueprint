module.exports = {
  '/messageboard' : {
    get  : { view : 'messageboard.pug' }
  },

  '/messages': {
    resource: {
      controller: 'message',
      deny: ['update']
    }
  }
};
