const { StripeAction, StripeResourceController } = require ('../../lib');

/**
 * The resource controller for managing Stripe external accounts objects on a Stripe
 * Connect account.
 */
module.exports = StripeResourceController.extend ({
  name: 'external-account',
  
  create () {
    return StripeAction.extend ({
      execute (req, res) {
        const { stripeExternalAccountId } = req.params;
        const { [this.controller.name]: { external_account } } = req.body;

        return this.stripe.accounts.createExternalAccount (stripeExternalAccountId, { external_account })
          .then (result => res.status (200).json ({[this.controller.name]: result}));
      }
    });
  },

  getOne () {
    return StripeAction.extend ({
      execute (req, res) {
        const { stripeExternalAccountId, externalAccountId } = req.params;

        return this.stripe.accounts.retrieveExternalAccount (stripeExternalAccountId, externalAccountId)
          .then (result => res.status (200).json ({[this.controller.name]: result}));
      }
    });
  },

  getAll () {
    return StripeAction.extend ({
      schema: {
        type: {
          in: 'query',
          options: ['card', 'bank_account'],
          errorMessage: 'You must provide either card or bank_account in your query.'
        }
      },

      execute (req, res) {
        const { stripeExternalAccountId } = req.params;
        const { type } = req.query;
        const params = { object: type };

        return this.stripe.accounts.listExternalAccounts (stripeExternalAccountId, params)
          .then (result => res.status (200).json ({[`${this.controller.name}s`]: result.data}));
      }
    });
  },

  update () {
    return StripeAction.extend ({
      execute (req, res) {
        const { stripeExternalAccountId, externalAccountId } = req.params;
        const { 'stripe-external-account': update } = req.body;

        return this.stripe.accounts.updateExternalAccount (stripeExternalAccountId, externalAccountId, update)
          .then (result => res.status (200).json ({ [this.controller.name]: result }));
      }
    });
  },

  delete () {
    return StripeAction.extend ({
      execute (req, res) {
        const { stripeExternalAccountId, externalAccountId } = req.params;

        return this.stripe.accounts.deleteExternalAccount (stripeExternalAccountId, externalAccountId)
          .then (result => res.status (200).json (result.deleted));
      }
    });
  }
});