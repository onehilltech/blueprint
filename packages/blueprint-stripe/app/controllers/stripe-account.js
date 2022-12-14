const { StripeResourceController, StripeAction } = require ('../../lib');

/**
 * The resource controller for managing Stripe accounts.
 */
module.exports = StripeResourceController.extend ({
  name: 'account',

  /**
   * Create a new account.
   */
  create () {
    return StripeAction.extend ({
      schema: {
        'stripe-account.type': {
          in: 'body',
          isIn: {
            options: ['standard', 'express', 'custom']
          }
        }
      },

      async execute (req, res) {
        const { 'stripe-account': data } = req.body;

        const result = await this.stripe.accounts.create (data);
        return res.status (200).json ({'stripe-account': result});
      }
    });
  },

  /**
   * Get a single account.
   */
  getOne () {
    return StripeAction.extend ({
      async execute (req, res) {
        const { stripeAccountId } = req.params;

        const result = await this.stripe.accounts.retrieve (stripeAccountId);
        return res.status (200).json ({'stripe-account': result});
      }
    });
  },

  /**
   * Update the details of a Stripe account.
   */
  update () {
    return StripeAction.extend ({
      async execute (req, res) {
        const { stripeAccountId } = req.params;
        const { 'stripe-account': update } = req.body;

        const result = await this.stripe.accounts.update (stripeAccountId, update);
        return res.status (200).json ({ 'stripe-account': result });
      }
    });
  },

  /**
   * Delete the Stripe account.
   *
   * @returns {*|Promise<*>}
   */
  delete () {
    return StripeAction.extend ({
      async execute (req, res) {
        const { stripeAccountId } = req.params;

        const result = await this.stripe.accounts.del (stripeAccountId);
        return res.status (200).json (result.deleted);
      }
    });
  }
});