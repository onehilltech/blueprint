const { Controller } = require ('@onehilltech/blueprint');
const { StripeAction } = require ('../../lib');

/**
 * The resource controller for managing Stripe accounts.
 */
module.exports = Controller.extend ({
  /**
   * Get a single account.
   */
  get () {
    return StripeAction.extend ({
      execute (req, res) {
        const { stripeAccountId: stripeAccount } = req.params;

        return this.stripe.balance.retrieve ({ stripeAccount })
          .then (result => res.status (200).json ({'stripe-balance': result}));
      }
    });
  }
});
