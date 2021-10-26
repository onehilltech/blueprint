const db = require ('@onehilltech/blueprint-mongodb');
const { Schema } = db;

const StripeAccountRefSchema = new Schema({
  /// The id associated with the Stripe account.
  id: { type: String },

  /// Charges are enabled on the Stripe account.
  charges_enabled: { type: Boolean },

  /// Payouts are enabled on the Stripe account.
  payouts_enabled: { type: Boolean },

  /// The requirements for the account. The content of this object is used
  /// to inform the platform what information is needed about a Stripe account.
  requirements: {}
}, { _id: false });

module.exports = StripeAccountRefSchema;
