const { Service, BO, env } = require ('@onehilltech/blueprint');
const Stripe = require ('stripe');
const { forOwn, mapValues } = require ('lodash');
const { props } = require ('bluebird');
const path = require ('path');
const fs = require ('fs-extra')

/**
 * @class StripeService
 */
module.exports = Service.extend ({
  _stripe: null,
  _webhooks: null,
  /**
   * Initialize the service.
   */
  init () {
    this._super.call (this, ...arguments);

    const { secretKey, apiVersion } = this.app.lookup ('config:stripe');
    this._stripe = new Stripe (secretKey, { apiVersion });

    // Now, map all properties on the stripe object that has a resourcePath to a
    // property definition on this class.
    forOwn (this._stripe, (value, key) => {
      if (value.resourcePath !== undefined) {
        Object.defineProperty (this, key, {
          get () { return this._stripe[key]; }
        });
      }
    });

    // Create an empty collection of webhooks.
    this._webhooks = {};
  },

  /**
   * Configure the service.
   */
  async configure () {
    await this._configureWebhooks ();
  },


  constructEvent (req, name) {
    const webhook = this._webhooks[name];

    if (!!webhook)
      return webhook.constructEvent (req);
  },

  /**
   * Configure webhooks for the application.
   *
   * @private
   */
  async _configureWebhooks () {
    const { configs: { stripe = {} } } = this.app;
    const { webhooks = {} } = stripe;

    // Construct the temp path, and make sure the path exists.
    const tempPath = path.resolve (this.app.tempPath, 'stripe/webhooks');
    await fs.ensureDir (tempPath);

    const results = mapValues (webhooks, async (options, name) => {
      // Let's see if we have a temp file for this webhook with the secret. If we already
      // have a temp file, then load the webhook details from there. Otherewise, we need
      // to register a new webhook.

      const tempFile = path.resolve (tempPath, name);
      const exists = await fs.pathExists (tempFile);

      if (exists) {
        const endpoint = await fs.readJson (tempFile);
        return new Webhook (this._stripe, endpoint);
      }
      else {
        const { url, enabled_events = ['*'], connect = false } = options;
        const endpoint = await this._stripe.webhookEndpoints.create ({ url, enabled_events, connect });

        // Let's write the endpoint to a file to save it.
        await fs.writeJson (tempFile, endpoint, { spaces: '\t' });

        return new Webhook (this._stripe, endpoint);
      }
    });

    this._webhooks = await props (results);
  },
});

/**
 * @class Webhook
 *
 * Wrapper facade for interacting with Stripe Webhooks.
 */
class Webhook {
  constructor (stripe, endpoint) {
    this.stripe = stripe;
    this.endpoint = endpoint;
  }

  constructEvent (req) {
    const sig = req.get ('stripe-signature');
    return this.stripe.webhooks.constructEvent (req.body, sig, this.endpoint.secret);
  }
}
