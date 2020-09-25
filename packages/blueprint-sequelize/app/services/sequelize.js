const { Service, computed, Loader } = require ('@onehilltech/blueprint');
const { Backend, build, seed, clear } = require ('@onehilltech/dab');
const Sequelize  = require ('sequelize');
const path = require ('path');
const pluralize = require ('pluralize');

const { forOwn, mapValues, pickBy, map, isPlainObject, filter, isEmpty, values, find } = require ('lodash');
const { props } = require ('bluebird');

const debug = require ('debug') ('blueprint:sequelize');
const assert = require ('assert');

const DEFAULT_CONNECTION_NAME = '$default';
const SEEDS_RELATIVE_PATH = 'seeds/sequelize';

const SequelizeBackend = Backend.extend ({
  conn: null,

  _nextId: null,

  init () {
    this._super.call (this, ...arguments);

    this._nextId = mapValues (this.conn.models, () => 0);
  },

  supports (conn, name) {
    const modelName = pluralize.singular (name);
    return !!this.conn.models[modelName];
  },

  getPrimaryKeyForPath (path) {
    let modelName = this.getModelNameForPath (path);
    
    if (!modelName)
      return 'ID';

    let Model = this.conn.models[modelName];
    const { primaryKeyAttribute } = Model;

    return primaryKeyAttribute;
  },

  generateId (value, path) {
    let modelName = this.getModelNameForPath (path);
    return this._nextId[modelName] ++;
  },

  getModelNameForPath (path) {
    let [ plural ] = path.split ('.');
    return pluralize.singular (plural);
  },

  seed (conn, models) {
    // First, we need to determine the order for inserting the models into the database. This
    // is important will dealing with foreign references in SQL. If a dependency is not present
    // in the database and references constraints are turned on, then the insertion will fail.
    // We could temporarily turn off the constraints, but that could cause harm.

    const names = Object.keys (models).map (key =>  pluralize.singular (key));
    const topological = names.sort ((name1, name2) => {
      const M1 = conn.models[name1];
      const M2 = conn.models[name2];

      function dependsOn (name) {
        return function (association) {
          if (association.associationType === 'BelongsTo')
            return association.target.name === name;
          else
            return false;
        }
      }

      if (find (values (M1.associations), dependsOn (M2.name)))
        return 1;
      else if (find (values (M2.associations), dependsOn (M1.name)))
        return -1;
      else
        return 0;
    });

    // Use the topological ordering to insert the records into the database.

    return Promise.all (topological.map (name => {
      let plural = pluralize.plural (name);
      let records = models[plural];
      let Model = conn.models[name];

      return Model.bulkCreate (records).then (() => Model.findAll ());
    })).then (results => results.reduce ((acc, models, index) => {
      let key = pluralize.plural (topological[index]);
      acc[key] = models;

      return acc;
    }, {}));
  },

  clear (conn, Models) {
    let filtered = isEmpty (Models) ? conn.models : filter (conn.models, Model => Models.includes (Model.name));
    return props (mapValues (filtered, Model => Model.destroy ({ truncate: true })));
  }
});

module.exports = Service.extend ({
  config: null,

  _connections: null,

  _loader: new Loader (),

  init () {
    this._super.call (this, ...arguments);

    this._connections = {};
    this._seeds = {};
    this._seedDefs = null;

    this._loadConfiguration ();
  },

  defaultConnectionName: DEFAULT_CONNECTION_NAME,

  defaultConnection: computed ({
    get () { return this._connections [this.defaultConnectionName]; }
  }),

  connections: computed ({
    get () { return this._connections; }
  }),

  seeds: computed ({
    get () { return this._seeds; }
  }),

  definitions: computed ({
    get () { return this._seedDefs; }
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
    const {connections} = this.config;

    return props (mapValues (connections, (config, name) => this.openConnection (name, config)));
  },

  openConnection (name, config) {
    let connection = this._connections[name];
    let {seed = false, clear = true, sync = false} = config;

    return connection.authenticate ()
      .then (() => sync ? connection.sync () : null)
      .then (() => seed ? this.seedConnection (name, connection, clear) : null);
  },

  seedConnection (name, conn, clear) {
    if (!!clear && clear === true)
      clear = [];

    // When seeding a connection, we always build a new data model. This
    // is because we need to generate new ids for all model elements.
    const backend = new SequelizeBackend ({conn});

    return this._buildSeed (name, conn, backend)
      .then (data => !!data ? (!!clear ? this._clearConnection (name, conn, clear, backend) : Promise.resolve ())
        .then (() => pickBy (data, (models, name) => backend.supports (conn, name)))
        .then (data => seed (conn, data, { backend })) : null)
      .then (models => {
        this._seeds[name] = models;

        if (!!models)
          this.emit ('seeded', name, conn, models);

        return models;
      });
  },

  _clearConnection (name, conn, models, backend) {
    return clear (conn, models, { backend });
  },

  /**
   * Build the seeds for a connection.
   *
   * @param name
   * @param conn
   * @returns {*}
   * @private
   */
  _buildSeed (name, conn, backend) {
    return this._loadSeedDefinitions ().then (seeds => {
      debug (`building seed definition for connection ${name}`);
      let seed = seeds[name];

      if (!seed)
        return null;

      return Promise.resolve (seed.reset ())
        .then (() => seed.beforeModel ())
        .then (() => seed.model ())
        .then (models => build (pickBy (models, (models, name) => backend.supports (conn, name)), { backend }))
        .then (result => Promise.resolve (seed.afterModel (result)).then (() => result));
    });
  },

  /**
   * Load all the seed definitions into memory.
   *
   * @returns {*}
   * @private
   */
  _loadSeedDefinitions () {
    if (this._seedDefs)
      return Promise.resolve (this._seedDefs);

    debug ('loading seed definitions');

    const dirname = path.resolve (this.app.appPath, SEEDS_RELATIVE_PATH);
    const opts = {
      dirname,
      resolve (Seed) {
        assert (!isPlainObject (Seed), 'The seed must extend the Seed class');
        return new Seed ();
      }
    };

    return this._loader.load (opts)
      .then (result => {
        // Store the seed definitions.
        this._seedDefs = result;

        // Allow each seed to perform a one-time configuration.
        return props (map (result, seed => seed.configure ())).then (() => result);
      });
  },

});
