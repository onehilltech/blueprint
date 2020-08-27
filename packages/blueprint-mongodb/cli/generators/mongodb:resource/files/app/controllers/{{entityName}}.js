const { ResourceController } = require ('@onehilltech/blueprint-mongodb');
const { Model } = require ('@onehilltech/blueprint');

module.exports = ResourceController.extend ({
  Model: model ('{{referenceName}}')
});
