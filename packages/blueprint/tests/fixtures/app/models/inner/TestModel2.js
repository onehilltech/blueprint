var blueprint = require ('../../../lib')
  ;

var schema = new blueprint.Schema ({
  /// Username for the account.
  firstname : { type: String, trim: true, required: true },

  /// Encrypted password
  lastname : { type: String, trim: true, required: true},
});

const COLLECTION_NAME  = 'blueprint_testmodel2';
module.exports = exports = blueprint.model (COLLECTION_NAME, schema);
