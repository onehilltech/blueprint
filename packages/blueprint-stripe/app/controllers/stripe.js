const {
  Controller,
  Action
} = require ('@onehilltech/blueprint');

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
  emitStripeEvent () {
    return Action.extend ({
      execute (req, res) {
        // Emit the event internally for our listeners.
        let event = req.body;
        let name = `stripe.${event.type}`;

        // We do not wait for the event to process because (1) we need to return
        // control to Stripe ASAP (per their documentation); and (2) any error that
        // occurs because of processing is no concern to Stripe.

        this.emit (name, event).catch (err => console.warn (err.message));

        // Notify the Stripe.js platform that we received the event.
        res.sendStatus (200);
      }
    });
  }
});
