var blueprint = require ('../../blueprint')
  ;

var schema = new blueprint.Schema ({
  /// Username for the account.
  first_name : { type: String, trim: true, required: true },

  /// Encrypted password
  last_name : { type: String, trim: true, required: true},
});

const COLLECTION_NAME  = 'blueprint_testmodel1';
module.exports = exports = blueprint.model (COLLECTION_NAME, schema);
