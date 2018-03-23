const Object = require ('../object');
const assert = require ('assert');
const EventListeners = require ('./event-listeners');

/**
 * @class Messenger
 *
 * Wrapper class for the events.EventEmitter class to that provides more
 * domain-specific operations.
 */
module.exports = Object.extend ({
  init () {
    this._super.call (this, ...arguments);

    assert (!!this.key, 'Missing key property');

    this._listeners = {};
  },

  /**
   * Lookup the event listeners container for an event.
   *
   * @param ev      The name of the event
   * @returns {*}
   */
  lookup (ev) {
    let listeners = this._listeners[ev];

    if (listeners)
      return listeners;

    return this._listeners[ev] = new EventListeners ({name: ev});
  },

  /**
   * Register a listener with the messenger.
   *
   * @param ev
   * @param listener
   */
  on (ev, listener) {
    return this.lookup (ev).on (listener);
  },

  /**
   * Register a listener for a single invocation of an event.
   *
   * @param ev
   * @param listener
   * @returns {Emitter|*|EventEmitter}
   */
  once (ev, listener) {
    return this.lookup (ev).once (listener);
  },

  /**
   * Emit an event to the messenger. The event is sent to all registered
   * listeners in the messenger.
   *
   * @returns {Promise}
   */
  emit () {
    let [name, ...args] = arguments;
    let listeners = this._listeners[name];

    return listeners ? listeners.emit (...args) : Promise.resolve ();
  }
});
