const mongodb = require ('@onehilltech/blueprint-mongodb');
const { Schema } = mongodb;
const { Types: { refersTo }} = Schema;

const options = {
{{#if collection}}
  // Name of the resource collection
  collection: '{{collection}}',
{{/if}}
};

const schema = new Schema ({
  // add your schema definition here
}, options);

module.exports = mongodb.resource ('{{entityBaseName}}', schema);
