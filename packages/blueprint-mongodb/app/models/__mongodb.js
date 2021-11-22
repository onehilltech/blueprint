const mongodb = require ('../../lib');
const mongoose = require ('mongoose');

const options = {
  // Name of the resource collection
  collection: 'blueprint_mongodb',
};

const schema = new mongodb.Schema ({
  /// Version number of the application database schema.
  version: { type: Number, required: true, default: 1 }
}, options);

module.exports = mongoose.model ('__mongodb', schema);
