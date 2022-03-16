const mongodb = require ('@onehilltech/blueprint-mongodb');
const blueprint = require ('@onehilltech/blueprint');
const { urlAlphabet, customAlphabet } = require ('nanoid');
const md5 = require ('md5');

const { configs: { urls = {} }} = blueprint.app;
const { shortener: config = {} } = urls;

const {
  /// The default alphabet used by the url shortener.
  alphabet = urlAlphabet,

  /// The default size for the short url.
  defaultSize = 10,

  /// The customer short code generator.
  shortCodeGenerator: shortId = customAlphabet (alphabet, defaultSize),

  /// Max number of tries to generate a unique short id.
  maxTries = 10,
} = config;

// use mongodb.Types to access mongoose.Types

const options = {
  // Name of the model collection.
  collection: 'blueprint_short_urls',

  /// We soft delete all urls in the database.
  softDelete: true
};

/**
 * @schema ShortUrl
 *
 * The mongoose schema definition for the short-url model.
 */
const schema = new mongodb.Schema ({
  /// The original url that was shortened.
  url: { type: String, required: true },

  /// The hash for the url. This is easier to index instead of indexing the url.
  hash: { type: String, required: true },

  /// The optional domain for the short url.
  domain: { type: String },

  /// The short code for the url. The short url is the concatenation of the
  /// short_origin and short_code.
  short_code: { type: String, required: true },

  /// The redirect status for the short url.
  redirect_status: { type: Number }
}, options);

// Do not allow duplicate codes on the same domain.
schema.index ({domain: 1, short_code: 1}, {unique: true});

// Do not allow duplicate urls (or hashes) on the same domain.
schema.index ({domain: 1, hash: 1}, {unique: true});

/**
 * Auto-generate a short id if a short code is not provided.
 */
schema.pre ('validate', function (next) {
  if (!this.short_code)
    this.short_code = shortId ();

  // Store the hash of the url for faster lookup.
  this.hash = md5 (this.url);

  next ();
});

module.exports = mongodb.resource ('short-url', schema);
