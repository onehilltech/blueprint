const { ResourceController } = require ('@onehilltech/blueprint-mongodb');
const { model } = require ('@onehilltech/blueprint');

module.exports = ResourceController.extend ({
  /// Reference to the target resource.
  Model: model ('short-url'),

  /// Namespace for prevent clashes.
  namespace: 'blueprint'
});
