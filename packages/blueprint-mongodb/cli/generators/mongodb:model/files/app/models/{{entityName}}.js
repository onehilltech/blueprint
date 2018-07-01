const mongodb = require ('@onehilltech/blueprint-mongodb');
const { Schema } = mongodb;

// use mongodb.Types to access mongoose.Types

const schema = Schema ({
  // add your schema definition here
});

module.exports = mongodb.resource ('{{entityBaseName}}', schema{{#if collectionName}}, '{{collectionName}}'{{/if}});
