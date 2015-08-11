var mongoose = require ('mongoose');

var schema = new mongoose.Schema({
  /// Author of the book.
  author: {type: String, required: true, trim: true},

  /// Title of the book.
  title: {type: String, required: true, trim: true},
});

const COLLECTION_NAME = 'book';
require ('blueprint').model (COLLECTION_NAME, schema);
