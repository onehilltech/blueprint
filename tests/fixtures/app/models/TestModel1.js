var blueprint = require ('../../blueprint')
  ;

var Schema = blueprint.Schema;
console.log (Schema);

var schema = new Schema ({
  /// Username for the account.
  firstname : { type: String, trim: true, required: true },

  /// Encrypted password
  lastname : { type: String, trim: true, required: true},
});

const COLLECTION_NAME  = 'blueprint_testmodel1';
module.exports = exports = blueprint.model (COLLECTION_NAME, schema);
