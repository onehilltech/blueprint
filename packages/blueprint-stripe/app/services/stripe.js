const { Service, BO, env } = require ('@onehilltech/blueprint');
const Stripe = require ('stripe');
const { forOwn } = require ('lodash');

module.exports = Service.extend ({
  _stripe: null,
  _eventConstructor: null,

  /**
   * Initialize the service.
   */
  init () {
    this._super.call (this, ...arguments);

    const { secretKey, apiVersion, endpointSecret } = this.app.lookup ('config:stripe');

    this._stripe = new Stripe (secretKey, { apiVersion });
    this._eventConstructor = endpointSecret ?
      VerifyEventConstructor.create ({stripe: this._stripe, endpointSecret}) :
      SimpleEventConstructor.create ();

    // Now, map all properties on the stripe object that has a resourcePath to a
    // property definition on this class.
    forOwn (this._stripe, (value, key) => {
      if (value.resourcePath !== undefined) {
        Object.defineProperty (this, key, {
          get () { return this._stripe[key]; }
        });
      }
    });
  },


  /**
   * Construct a stripe event from the request.
   *
   * @param req
   * @returns {Stripe.Event}
   */
  constructEvent (req) {
    return this._eventConstructor.constructEvent (req);
  }
});

const EventConstructor = BO.extend ({
  constructEvent: null,
});

/**
 * Implementation of the event constructor that simply returns the Stripe event.
 */
const SimpleEventConstructor = EventConstructor.extend ({
  constructEvent (req) {
    if (env === 'production')
      console.warn ('Your Stripe webhook is insecure. Please set the endpointSecret property in configs/stripe.js to secure your webhook.');

    return req.body;
  }
});

/**
 * Implementation of the event constructor that verifies the Stripe event.
 */
const VerifyEventConstructor = EventConstructor.extend ({
  stripe: null,
  endpointSecret: null,

  constructEvent (req) {
    const sig = req.get ('stripe-signature');
    const str = JSON.stringify (req.body);

    return this.stripe.webhooks.constructEvent (str, sig, this.endpointSecret);
  }
});
