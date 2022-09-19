const { Service } = require ('@onehilltech/blueprint');
const { Context } = require ('mocha');

const { seed, build } = require ('@onehilltech/dab');
const backend = require ('@onehilltech/dab-mongodb');

const { pickBy } = require ('lodash');

module.exports = Service.extend ({
  configure () {
    const mongodb = this.app.lookup ('service:mongodb');

    // We are going to update the context with a seed method.
    Context.prototype.seed = async function (definitions, options = {}) {
      const { connectionName = '$default' } = options;
      const connection = mongodb.connection (connectionName);

      if (!connection)
        throw new Error ('The connection `${connectionName}` does not exist.');

      // Prune the models that we do not support on this connection.
      const rawModels = await build (pickBy (definitions, (definition, name) => backend.supports (connection.conn, name)), { backend });

      // Seed the connection with the models.
      return await seed (connection.conn, rawModels, { backend });
    }
  }
})