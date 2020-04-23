const {
  Service,
  computed: { alias }
} = require ('@onehilltech/blueprint');

const winston = require ('winston');

/**
 * @class logger
 */
module.exports = Service.extend ({
  /// A collection of named loggers.
  _loggers: null,

  /// The main logger for the service.
  _mainLogger: null,

  init () {
    this._super.call (this, ...arguments);

    this._loggers = {};
  },

  /**
   * Configure the service.
   *
   * The service always as a default logger, even if there is no configuration defined for winston.
   */
  configure () {
    const { winston : config } = this.app.configs || {};
    this._mainLogger = this.createLogger (config, '__main__');
  },

  /**
   * Create a logger, and give it an optional name.
   *
   * @param opts
   * @param name
   * @returns {*}
   */
  createLogger (opts, name) {
    if (!!name) {
      if (this._loggers[name])
        return this._loggers[name];
    }

    let logger = winston.createLogger (opts);

    if (!!name)
      this._loggers[name] = logger;

    return logger;
  },

  /// @{ Main logger methods

  /// Get direct access to the main logger for manipulation.
  mainLogger: alias ('_mainLogger'),

  log () {
    return this._mainLogger.log (...arguments);
  },

  info () {
    return this._mainLogger.info (...arguments);
  },

  warn () {
    return this._mainLogger.warn (...arguments);
  },

  error () {
    return this._mainLogger.error (...arguments);
  }

  /// @}
});
