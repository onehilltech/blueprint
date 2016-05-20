var blueprint = require ('@onehilltech/blueprint')
  ;

var schema = new blueprint.Schema({
  first_name: {type: String, required: true, trim: true},
  last_name: {type: String, required: true, trim: true},
});

const COLLECTION_NAME = 'person';
module.exports = exports = blueprint.model (COLLECTION_NAME, schema);
