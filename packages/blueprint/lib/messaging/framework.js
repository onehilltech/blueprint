const Object = require ('../object');
const Messenger = require ('./messenger');

const DEFAULT_MESSENGER_KEY = '_';

/**
 * @class MessagingFramework
 *
 * The root object in the messaging framework.
 */
module.exports = Object.extend ({
  init () {
    this._super.call (this, ...arguments);
    this.reset ();
  },

  /**
   * Reset the state of the messaging framework.
   */
  reset () {
    this.messengers = {
      [DEFAULT_MESSENGER_KEY]: new Messenger ({key: DEFAULT_MESSENGER_KEY})
    };
  },

  /**
   * Lookup a messenger. If the messenger does not exist, then it will create
   * a new one for the key.
   *
   * @param key
   * @returns {Messenger}
   */
  lookup (key = DEFAULT_MESSENGER_KEY) {
    let messenger = this.messengers[key];

    if (messenger)
      return messenger;

    return this.messengers[key] = new Messenger ({key});
  },

  /**
   * Register a listener with the default messenger.
   *
   * @param ev
   * @param listener
   */
  on (ev, listener) {
    return this.messengers[DEFAULT_MESSENGER_KEY].on (ev, listener);
  },

  /**
   * Register a one-time listener with the default messenger.
   *
   * @param ev
   * @param listener
   */
  once (ev, listener) {
    return this.messengers[DEFAULT_MESSENGER_KEY].once (ev, listener);
  },

  /**
   * Emit an event to the default messenger.
   */
  emit () {
    return this.messengers[DEFAULT_MESSENGER_KEY].emit (...arguments);
  },

  /**
   * Relay the results of a callback as an event.
   *
   * @param ev Target event to relay callback
   * @returns {Function}
   */
  relay (ev) {
    return () => {
      let args = Array.from (arguments);
      args.unshift (ev);

      this.emit (...args);
    };
  }
});
