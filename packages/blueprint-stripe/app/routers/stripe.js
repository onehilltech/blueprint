const bodyParser = require ('body-parser');

module.exports = {
  '/webhooks': {
    use: bodyParser.raw (),
    post: { action: 'stripe@emitStripeEvent' }
  }
}