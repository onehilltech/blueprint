const { ResourceController, Action, service } = require ('@onehilltech/blueprint');

module.exports = ResourceController.extend ({
  name: 'externalAccount',

  create () {

  },

  getOne () {
    return Action.extend ({
      stripe: service (),

      execute (req, res) {
        const { accountId, externalAccountId } = req.params;

        return this.stripe.accounts.retrieveExternalAccount (accountId, externalAccountId)
          .then (result => res.status (200).json ({'stripe-external-account': result}));
      }
    })
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
          .then (result => res.status (200).json ({'stripe-external-accounts': result.data}));
      }
    });
  },

  update () {
    return Action.extend ({

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