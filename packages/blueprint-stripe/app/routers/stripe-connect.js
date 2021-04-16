module.exports = {
  '/accounts': {
    resource: {
      controller: 'stripe-account',
      deny: ['count', 'getAll'],
    },

    '/:accountId': {
      '/external-accounts': {
        resource: {
          controller: 'stripe-external-account',
          deny: ['count']
        }
      },

      '/persons': {
        resource: {
          controller: 'stripe-person',
          deny: ['count']
        }
      }
    }
  }
};