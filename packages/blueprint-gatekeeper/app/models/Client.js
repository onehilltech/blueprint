const mongodb = require ('@onehilltech/blueprint-mongodb');
const options = require ('./commonOptions') ();
const Account = require ('./Account');

const {
  Schema: {
    Types: {ObjectId}
  }
} = mongodb;

options.discriminatorKey = 'type';

let schema = new Schema ({
  /// The type of client.
  type: {type: String, required: true},

  /// Name of the client.
  name: {type: String, required: true, trim: true},

  /// Contact email address for the client.
  email: {type: String, required: true, trim: true},

  /// Enabled state of the client.
  enabled: {type: Boolean, default: true, required: true},

  /// The default scope for the client. The scope is applied to the access
  /// token for the client.
  scope: {type: [String], default: []},

  /// The client is private. A private client can only be accessed by the user
  /// associated with the email for this client, and those that appear in the
  /// whitelist.
  private: {type: Boolean, default: false},

  /// Accounts allowed to use the client. This list is used when the client
  /// is marked private.
  allow: {type: [ObjectId], ref: Account.modelName},

  /// Accounts not allowed to use the client. This list is always used.
  deny: {type: [ObjectId], ref: Account.modelName}
}, options);

const MODEL_NAME = 'client';
const COLLECTION_NAME = 'gatekeeper_clients';

module.exports = mongodb.resource (MODEL_NAME, schema, COLLECTION_NAME);
