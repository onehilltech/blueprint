var blueprint = require ('@onehilltech/blueprint')
  ;

var Schema = blueprint.Schema;

var schema = new Schema({
  image: {type: Schema.Types.ObjectId, required: true},
});

const COLLECTION_NAME = 'image';
module.exports = exports = blueprint.model (COLLECTION_NAME, schema);
