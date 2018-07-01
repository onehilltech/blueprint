const mongodb = require ('@onehilltech/blueprint-mongodb');
const { Schema } = mongodb;

// use mongodb.Types to access mongoose.Types

const options = {
{{#if collection}}
  collection: '{{collection}}',
{{/if}}
};

const schema = new Schema ({
  // add your schema definition here
}, options);

module.exports = mongodb.resource ('{{entityBaseName}}', schema);
