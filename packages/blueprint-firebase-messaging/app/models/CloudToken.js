var blueprint = require ('@onehilltech/blueprint')
  ;

var schema = new blueprint.Schema({
  /// Registration token for Google Cloud Messaging.
  gcm: {type: String}
});

const COLLECTION_NAME = 'blueprint_cloud_registration';
module.exports = exports = blueprint.model (COLLECTION_NAME, schema);
