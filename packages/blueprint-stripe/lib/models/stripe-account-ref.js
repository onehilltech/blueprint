const db = require ('@onehilltech/blueprint-mongodb');
const { Schema } = db;

const StripeAccountRefSchema = new Schema({
  /// The id associated with the Stripe account.
  account: { type: String, required: true },

  /// Charges are enabled on the Stripe account.
  charges_enabled: { type: Boolean },

  /// Payouts are enabled on the Stripe account.
  payouts_enabled: { type: Boolean }
});

module.exports = StripeAccountRefSchema;
