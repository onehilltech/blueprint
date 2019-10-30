const { Service, computed } = require ('@onehilltech/blueprint');

const Sequelize  = require ('sequelize');
const { forOwn, mapValues } = require ('lodash');
const Bluebird = require ('bluebird');

/**
 * @class sequelize
 */
module.exports = Service.extend ({
  config: null,

  _connections: null,

  init () {
    this._super.call (this, ...arguments);

    this._connections = {};
    this._loadConfiguration ();
  },

  defaultConnectionName: '$default',

  defaultConnection: computed ({
    get () { return this._connections [this.defaultConnectionName]; }
  }),

  _loadConfiguration () {
    // Locate the module configuration in the application. If there is no
    // configuration, then we need to stop processing. This brings attention
    // to the developer to resolve the problem.

    this.config = this.get ('app.configs.sequelize');

    if (!this.config)
      throw new Error ('The application does not define a sequelize configuration.');

    const { connections } = this.config || {};

    if (!!this.config.defaultConnectionName)
      this.defaultConnectionName = config.defaultConnectionName;

    // Create the individual connections.
    forOwn (connections, (opts, name) => this.createConnection (name, opts));
  },

  createConnection (name, opts) {
    const { username, password, database, options} = opts;
    let connection = new Sequelize (database, username, password, options);

    this._connections[name] = connection;

    return connection;
  },

  closeConnection (name) {
    let connection = this._connections[name];

    if (!connection)
      return Promise.reject (new Error (`The connection ${name} does not exist.`));

    delete this._connections[name];
    return connection.close ();
  },

  model (name, o) {

  },

  start () {
    return Bluebird.props (mapValues (this._connections, connection => connection.authenticate ()));
  }
});
