module.exports = {
  '/stripe': {
    //policy: check ('request.ips', blueprint.lookup ('config:stripe').ips),

    '/webhooks': {
      post: { action: 'stripe@emitStripeEvent' }
    }
  }
}