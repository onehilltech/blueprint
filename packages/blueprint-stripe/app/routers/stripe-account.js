module.exports = {
  '/accounts': {
    '/:accountId': {
      '/external-accounts': {
        resource: {
          controller: 'external-account',
          deny: ['count']
        }
      }
    }
  }
};