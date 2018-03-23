const CoreObject = require ('./object');

/**
 * @class Service
 *
 * The service represents an abstraction that runs in the background while the
 * application is live.
 */
module.exports = CoreObject.extend ({
  /**
   * Instruct the service to configure itself. We have the configure() method
   * because the init() method is synchronous. It is therefore hard for the service
   * to call methods that are asynchronous during configuration. The configure
   * method allows this because you can return a Promise, if needed.
   *
   * @return {Promise|null}
   */
  configure () {

  },

  /**
   * Instruct the service to start.
   *
   * @return {Promise|null}
   */
  start () {
    return null;
  }
});