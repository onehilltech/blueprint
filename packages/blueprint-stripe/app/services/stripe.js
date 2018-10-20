const { Service } = require ('@onehilltech/blueprint');
const Stripe = require ('stripe');
const { forOwn } = require ('lodash');

module.exports = Service.extend ({
  _stripe: null,

  init () {
    this._super.call (this, ...arguments);

    const { secretKey } = this.app.lookup ('config:stripe');
    this._stripe = new Stripe (secretKey);

    // Now, map all properties on the stripe object that has a resourcePath to a
    // property definition on this class.
    forOwn (this._stripe, (value, key) => {
      if (value.resourcePath !== undefined) {
        Object.defineProperty (this, key, {
          get () { return this._stripe[key]; }
        });
      }
    });
  }
});
