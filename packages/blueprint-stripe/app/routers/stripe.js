module.exports = {
  '/webhooks': {
    //policy: check ('request.ips', blueprint.lookup ('config:stripe').ips),
    post: { action: 'stripe@emitStripeEvent' }
  }
}