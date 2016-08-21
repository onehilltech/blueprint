var blueprint = require ('@onehilltech/blueprint')
  ;

var schema = new blueprint.Schema({
  /// Timestamp of the message.
  timestamp: {type: Date, required: true, default: Date.now},

  /// Title of the book.
  title: {type: String, required: true, trim: true},

  /// Content of the message.
  content: {type: String, required: true, trim: true}
});

const COLLECTION_NAME = 'message';
module.exports = exports = blueprint.model (COLLECTION_NAME, schema);
