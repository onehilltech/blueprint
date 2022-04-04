const bodyParser = require ('body-parser');

module.exports = {
  '/accounts': {
    use: [bodyParser.json (), bodyParser.urlencoded ({extended: false})],
    policy: '?stripe.connect.accounts',

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
  },

  '/webhooks': {
    use: bodyParser.raw ({type: 'application/json'}),
    post: { action: 'stripe@emitStripeEvent', options: { webhook: '$connect' } }
  }
};
