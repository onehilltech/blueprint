const { StripeResourceController, StripeAction } = require ('../../lib');

/**
 * The resource controller for managing Stripe accounts.
 */
module.exports = StripeResourceController.extend ({
  name: 'balance',

  /**
   * Get a single account.
   */
  getOne () {
    return StripeAction.extend ({
      execute (req, res) {
        const { stripeAccountId: stripeAccount } = req.params;

        return this.stripe.balance.retrieve ({ stripeAccount })
          .then (result => res.status (200).json ({[this.controller.resourceName]: result}));
      }
    });
  }
});