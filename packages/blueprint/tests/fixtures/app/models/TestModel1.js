var blueprint = require ('../../blueprint')
  ;

console.log (blueprint);

var Schema = blueprint.Schema;

var schema = new Schema ({
  /// Username for the account.
  firstname : { type: String, trim: true, required: true },

  /// Encrypted password
  lastname : { type: String, trim: true, required: true},
});

const COLLECTION_NAME  = 'blueprint_testmodel1';
module.exports = exports = blueprint.model (COLLECTION_NAME, schema);
