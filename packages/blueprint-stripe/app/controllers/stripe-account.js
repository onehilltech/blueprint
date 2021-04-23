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

      execute (req, res) {
        const { [this.controller.name]: data } = req.body;

        return this.stripe.accounts.create (data)
          .then (result => res.status (200).json ({[this.controller.resourceName]: result}));
      }
    });
  },

  /**
   * Get a single account.
   */
  getOne () {
    return StripeAction.extend ({
      execute (req, res) {
        const { stripeAccountId } = req.params;

        return this.stripe.accounts.retrieve (stripeAccountId)
          .then (result => res.status (200).json ({[this.controller.resourceName]: result}));
      }
    });
  },

  /**
   * Update the details of a Stripe account.
   */
  update () {
    return StripeAction.extend ({
      execute (req, res) {
        const { stripeAccountId } = req.params;
        const { 'stripe-account': update } = req.body;

        return this.stripe.accounts.update (stripeAccountId, update)
          .then (result => res.status (200).json ({ [this.controller.resourceName]: result }));
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
      execute (req, res) {
        const { stripeAccountId } = req.params;

        return this.stripe.accounts.del (stripeAccountId)
          .then (result => res.status (200).json (result.deleted));
      }
    });
  }
});