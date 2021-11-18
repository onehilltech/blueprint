module.exports = {
  '/accounts': {
    resource: {
      controller: 'stripe-account',
      deny: ['count', 'getAll'],
    },

    '/:stripeAccountId': {
      '/balance': {
        policy: '?stripe.balance.getOne',
        get: 'stripe-balance@get'
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