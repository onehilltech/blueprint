const { ResourceController, Action, service } = require ('@onehilltech/blueprint');
const { StripeAction } = require ('../../lib');

/**
 * The resource controller for managing Stripe accounts.
 */
module.exports = ResourceController.extend ({
  name: 'stripe-account',

  id: 'accountId',

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
          .then (result => res.status (200).json ({[this.controller.name]: result}));
      }
    });
  },

  /**
   * Get a single account.
   */
  getOne () {
    return StripeAction.extend ({
      execute (req, res) {
        const { accountId } = req.params;

        return this.stripe.accounts.retrieve (accountId)
          .then (result => res.status (200).json ({[this.controller.name]: result}));
      }
    });
  },

  /**
   * Update the details of a Stripe account.
   */
  update () {
    return StripeAction.extend ({
      execute (req, res) {
        const { accountId } = req.params;
        const { 'stripe-account': update } = req.body;

        return this.stripe.accounts.update (accountId, update)
          .then (result => res.status (200).json ({ [this.controller.name]: result }));
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
        const { accountId } = req.params;

        return this.stripe.accounts.del (accountId)
          .then (result => res.status (200).json (result.deleted));
      }
    });
  }
});