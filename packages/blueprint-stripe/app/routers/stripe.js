const bodyParser = require ('body-parser');

module.exports = {
  '/webhooks': {
    use: bodyParser.raw ({type: 'application/json'}),
    post: { action: 'stripe@emitStripeEvent', options: { webhook: '$default' } }
  }
}