const { StripeAction, StripeResourceController } = require ('../../lib');

/**
 * The resource controller for managing Stripe person objects on a Stripe
 * Connect account.
 */
module.exports = StripeResourceController.extend ({
  name: 'person',

  create () {
    return StripeAction.extend ({
      execute (req, res) {
        const { accountId } = req.params;
        const { [this.controller.name]: data } = req.body;

        return this.stripe.accounts.createPerson (accountId, data)
          .then (result => res.status (200).json ({[this.controller.resourceName]: result}));
      }
    });
  },

  getOne () {
    return StripeAction.extend ({
      execute (req, res) {
        const { accountId, personId } = req.params;

        return this.stripe.accounts.retrievePerson (accountId, personId)
          .then (result => res.status (200).json ({[this.controller.resourceName]: result}));
      }
    });
  },

  getAll () {
    return StripeAction.extend ({
      execute (req, res) {
        const { accountId } = req.params;

        return this.stripe.accounts.listPersons (accountId)
          .then (result => res.status (200).json ({[`${this.controller.resourceName}s`]: result.data}));
      }
    });
  },

  update () {
    return StripeAction.extend ({
      execute (req, res) {
        const { accountId, personId } = req.params;
        const { 'stripe-person': update } = req.body;

        return this.stripe.accounts.updatePerson (accountId, personId, update)
          .then (result => res.status (200).json ({ [this.controller.resourceName]: result }));
      }
    });
  },

  delete () {
    return StripeAction.extend ({
      execute (req, res) {
        const { accountId, personId } = req.params;

        return this.stripe.accounts.deletePerson (accountId, personId)
          .then (result => res.status (200).json (result.deleted));
      }
    });
  }
});