const BlueprintObject = require ('./object');
const SupportsMessaging = require ('./supports-messaging');

/**
 * @class Service
 *
 * The service represents an abstraction that runs in the background while the
 * application is live.
 */
module.exports = BlueprintObject.extend ({
  init () {
    this._super.init.apply (this, arguments);

    BlueprintObject.mixin (this, SupportsMessaging);
  },

  /**
   * Instruct the service to configure itself. We have the configure() method
   * because the init() method is synchronous. It is therefore hard for the service
   * to call methods that are asynchronous during configuration. The configure
   * method allows this because you can return a Promise, if needed.
   *
   * @return {Promise|null}
   */
  configure () {
    return null;
  },

  /**
   * Destroy the service.
   */
  destroy () {
    return null;
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