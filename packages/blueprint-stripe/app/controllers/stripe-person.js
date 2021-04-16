const { ResourceController, Action, service } = require ('@onehilltech/blueprint');

/**
 * The resource controller for managing Stripe person objects on a Stripe
 * Connect account.
 */
module.exports = ResourceController.extend ({
  name: 'stripe-person',

  id: 'personId',

  create () {
    return Action.extend ({
      stripe: service (),

      execute (req, res) {
        const { accountId } = req.params;
        const { [this.controller.name]: data } = req.body;

        return this.stripe.accounts.createPerson (accountId, data)
          .then (result => res.status (200).json ({[this.controller.name]: result}));
      }
    });
  },

  getOne () {
    return Action.extend ({
      stripe: service (),

      execute (req, res) {
        const { accountId, personId } = req.params;

        return this.stripe.accounts.retrievePerson (accountId, personId)
          .then (result => res.status (200).json ({[this.controller.name]: result}));
      }
    });
  },

  getAll () {
    return Action.extend ({
      stripe: service (),

      execute (req, res) {
        const { accountId } = req.params;

        return this.stripe.accounts.listPersons (accountId)
          .then (result => res.status (200).json ({[`${this.controller.name}s`]: result.data}));
      }
    });
  },

  update () {
    return Action.extend ({
      stripe: service (),

      execute (req, res) {
        const { accountId, personId } = req.params;
        const { 'stripe-person': update } = req.body;

        return this.stripe.accounts.updatePerson (accountId, personId, update)
          .then (result => res.status (200).json ({ [this.controller.name]: result }));
      }
    });
  },

  delete () {
    return Action.extend ({
      stripe: service (),

      execute (req, res) {
        const { accountId, personId } = req.params;

        return this.stripe.accounts.deletePerson (accountId, personId)
          .then (result => res.status (200).json (result.deleted));
      }
    });
  }
});