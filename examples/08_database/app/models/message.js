'use strict';

var mongodb = require ('@onehilltech/blueprint-mongodb')
  ;

var schema = new mongodb.Schema({
  /// Timestamp of the message.
  timestamp: {type: Date, required: true, default: Date.now},

  /// Title of the book.
  title: {type: String, required: true, trim: true},

  /// Content of the message.
  content: {type: String, required: true, trim: true},
});

const COLLECTION_NAME = 'message';
module.exports = mongodb.model (COLLECTION_NAME, schema);
