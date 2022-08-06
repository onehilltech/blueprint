const { Controller, Action, service } = require ('@onehilltech/blueprint');

/**
 * @class StripeController
 *
 * The controller for handling communication from the Stripe platform.
 */
module.exports = Controller.extend ({
  /**
   * Handle an event from the Stripe platform. The event is eventually published
   * internally under the 'stripe.' namespace so listeners can handle it.
   */
  emitStripeEvent (params = {}) {
    const { options = {} } = params;
    const { webhook: name } = options;

    return Action.extend ({
      stripe: service (),

      async execute (req, res) {
        try {
          // Emit the event internally for our listeners.
          const event = this.stripe.constructEvent (req, name);
          const eventName = `stripe.${event.type}`;

          await this.emit (eventName, event);
          res.sendStatus (200);
        }
        catch (err) {
          res.sendStatus (500);
        }
      }
    });
  }
});
