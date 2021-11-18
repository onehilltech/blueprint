module.exports = {
  '/accounts': {
    resource: {
      controller: 'stripe-account',
      deny: ['count', 'getAll'],
    },

    '/:stripeAccountId': {
      '/balance': {
        resource: {
          controller: 'stripe-balance',
          allow: ['getOne']
        }
      },

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