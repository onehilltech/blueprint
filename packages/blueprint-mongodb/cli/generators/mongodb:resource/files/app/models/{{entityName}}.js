const mongodb = require ('@onehilltech/blueprint-mongodb');
const { Schema } = mongodb;
const { Types: { refersTo }} = Schema;

// use mongodb.Types to access mongoose.Types

const options = {
{{#if collection}}
  // Name of the model collection.
  collection: '{{collection}}',
{{/if}}

{{#if softDelete}}
  // Support soft delete of the resource.
  softDelete: true,
{{/if}}
};

const schema = new Schema ({
  // add your schema definition here
}, options);

module.exports = mongodb.resource ('{{entityBaseName}}', schema);
