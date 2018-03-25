const {
  Service,
  barrier
} = require ('@onehilltech/blueprint');

const {
  forOwn,
  merge
} = require ('lodash');

const mongoose = require ('mongoose');
const {get} = require ('object-path');
const debug = require ('debug')('blueprint-mongodb:mongodb');

const DEFAULT_CONNECTION_NAME = '$default';

mongoose.Promise = Promise;

module.exports = Service.extend ({
  /// Named connections managed by the service.
  _connections: { },

  _appStart: barrier ('blueprint.app.start', 'blueprint-mongodb:mongodb'),

  init () {
    this._super.apply (this, arguments);

    Object.defineProperty (this, 'defaultConnection', {
      get () { return this._connections[this._defaultName]; }
    });

    Object.defineProperty (this, 'connections', {
      get () { return this._connections; }
    });

    // setup the messaging.
    this.on ('blueprint.app.starting', this.openConnections.bind (this));

    this._loadConfiguration ();
  },

  _loadConfiguration () {
    // Locate the module configuration in the application. If there is no
    // configuration, then we need to stop processing. This brings attention
    // to the developer to resolve the problem.

    this.config = this.get ('app.configs.mongodb');

    if (!this.config)
      throw new Error ('The application does not define a mongodb configuration.');

    this._defaultName = get (this.config, 'defaultConnection', DEFAULT_CONNECTION_NAME);
    const {connections} = this.config;

    if (!connections || connections.length === 0)
      throw new Error ('You must define at least 1 connection in the configuration.');

    if (!connections[this._defaultName])
      throw new Error ('The default connection configuration is not defined.');

    // Capture the default connection in mongoose, which is always the
    // first connection in the listing.
    this._connections[this._defaultName] = mongoose.connections[0];

    // Create the individual connections.
    forOwn (connections, (opts, name) => this.createConnection (name));
  },

  destroy () {
    return this.closeConnections ();
  },

  /**
   * Create a new connection.
   *
   * @param name
   * @returns {*}
   */
  createConnection (name) {
    if (name === this._defaultName)
      return mongoose.connections[0];

    let conn = mongoose.createConnection ();
    this._connections[name] = conn;

    return conn;
  },

  /**
   * Open the existing connections.
   */
  openConnections () {
    debug ('opening all connections to the database');

    let {connections} = this.config;
    let connecting = [];

    forOwn (connections, (opts, name) => {
      debug (`opening connection ${name}`);

      let options = merge ({useMongoClient: true}, opts.options);
      let connection = this._connections[name];

      connecting.push (connection.openUri (opts.connstr, options));
    });

    return Promise.all (connecting).then (() => {
      this.app.messaging.emit ('mongodb.connections.open');

      return this._appStart.signal ();
    });
  },

  /**
   * Close all open connections.
   */
  closeConnections () {
    let pending = [];

    forOwn (this._connections, conn => {
      if (conn.readyState !== 0)
        pending.push (conn.close ());
    });

    return Promise.all (pending);
  }
});
