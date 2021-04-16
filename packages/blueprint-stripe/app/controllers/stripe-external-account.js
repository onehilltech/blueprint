const { ResourceController, Action, service } = require ('@onehilltech/blueprint');

/**
 * The resource controller for managing Stripe external accounts objects on a Stripe
 * Connect account.
 */
module.exports = ResourceController.extend ({
  name: 'stripe-external-account',

  id: 'externalAccountId',

  create () {
    return Action.extend ({
      stripe: service (),

      execute (req, res) {
        const { accountId } = req.params;
        const { [this.controller.name]: { external_account } } = req.body;

        return this.stripe.accounts.createExternalAccount (accountId, { external_account })
          .then (result => res.status (200).json ({[this.controller.name]: result}));
      }
    });
  },

  getOne () {
    return Action.extend ({
      stripe: service (),

      execute (req, res) {
        const { accountId, externalAccountId } = req.params;

        return this.stripe.accounts.retrieveExternalAccount (accountId, externalAccountId)
          .then (result => res.status (200).json ({[this.controller.name]: result}));
      }
    });
  },

  getAll () {
    return Action.extend ({
      schema: {
        type: {
          in: 'query',
          options: ['card', 'bank_account'],
          errorMessage: 'You must provide either card or bank_account in your query.'
        }
      },

      stripe: service (),

      execute (req, res) {
        const { accountId } = req.params;
        const { type } = req.query;
        const params = { object: type };

        return this.stripe.accounts.listExternalAccounts (accountId, params)
          .then (result => res.status (200).json ({[`${this.controller.name}s`]: result.data}));
      }
    });
  },

  update () {
    return Action.extend ({
      stripe: service (),

      execute (req, res) {
        const { accountId, externalAccountId } = req.params;
        const { 'stripe-external-account': update } = req.body;

        return this.stripe.accounts.updateExternalAccount (accountId, externalAccountId, update)
          .then (result => res.status (200).json ({ [this.controller.name]: result }));
      }
    });
  },

  delete () {
    return Action.extend ({
      stripe: service (),

      execute (req, res) {
        const { accountId, externalAccountId } = req.params;

        return this.stripe.accounts.deleteExternalAccount (accountId, externalAccountId)
          .then (result => res.status (200).json (result.deleted));
      }
    });
  }
});