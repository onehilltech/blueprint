const mongodb = require ('@onehilltech/blueprint-mongodb');
const { Schema } = mongodb;
const { Types: { refersTo }} = Schema;

// use mongodb.Types to access mongoose.Types

const options = {
  // Name of the model collection.
  collection: 'blueprint_short_urls',

  /// We soft delete all urls in the database.
  softDelete: true
};

const schema = new Schema ({
  /// The optional domain for the short url.
  domain: { type: String },

  /// The short code for the url. The short url is the concatenation of the
  /// short_origin and short_code.
  short_code: { type: String, required: true },

  /// The original url that was shortened.
  original_url: { type: String, required: true, index: true },

  /// The redirect status for the short url.
  redirect_status: { type: Number }
}, options);

schema.index ({domain: 1, short_code: 1}, {unique: true});

module.exports = mongodb.resource ('short-url', schema);
