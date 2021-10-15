const db = require ('@onehilltech/blueprint-mongodb');
const { Schema } = db;

const StripeAccountRefSchema = new Schema({
  /// The id associated with the Stripe account.
  id: { type: String, required: true },

  /// The status of the Stripe account
  status: { type: String }
});

module.exports = StripeAccountRefSchema;
