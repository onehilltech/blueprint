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
        const { stripeAccountId } = req.params;
        const { [this.controller.name]: data } = req.body;

        return this.stripe.accounts.createPerson (stripeAccountId, data)
          .then (result => res.status (200).json ({[this.controller.resourceName]: result}));
      }
    });
  },

  getOne () {
    return StripeAction.extend ({
      execute (req, res) {
        const { stripeAccountId, stripePersonId } = req.params;

        return this.stripe.accounts.retrievePerson (stripeAccountId, stripePersonId)
          .then (result => res.status (200).json ({[this.controller.resourceName]: result}));
      }
    });
  },

  getAll () {
    return StripeAction.extend ({
      execute (req, res) {
        const { stripeAccountId } = req.params;

        return this.stripe.accounts.listPersons (stripeAccountId)
          .then (result => res.status (200).json ({[`${this.controller.resourceName}s`]: result.data}));
      }
    });
  },

  update () {
    return StripeAction.extend ({
      execute (req, res) {
        const { stripeAccountId, stripePersonId } = req.params;
        const { 'stripe-person': update } = req.body;

        // Make sure the account property is not part of the update since it comes
        // from the parameter in the url.
        delete update.account;

        return this.stripe.accounts.updatePerson (stripeAccountId, stripePersonId, update)
          .then (result => res.status (200).json ({ [this.controller.resourceName]: result }));
      }
    });
  },

  delete () {
    return StripeAction.extend ({
      execute (req, res) {
        const { stripeAccountId, stripePersonId } = req.params;

        return this.stripe.accounts.deletePerson (stripeAccountId, stripePersonId)
          .then (result => res.status (200).json (result.deleted));
      }
    });
  }
});