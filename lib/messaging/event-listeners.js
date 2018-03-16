const Object = require ('../object');
const assert = require ('assert');
const ListenerHandle = require ('./listener-handle');
const Listener = require ('./listener');
const async = require ('async');

/**
 * Wrapper class for a set of listeners for an event.
 */
module.exports = Object.extend ({
  /// Name of the event the listeners handle.
  name: null,

  init () {
    this._super.call (this, ...arguments);

    assert (this.name, 'Missing name property');

    this._on = [];
    this._once = [];
  },

  /**
   * Register a new listener for the event.
   *
   * @param listener
   */
  on (listener) {
    assert ((listener instanceof Listener), 'listener is not an instance of Listener');

    let index = this._on.push (listener) - 1;
    return new ListenerHandle ({listeners: this, index});
  },

  /**
   * Register a listener that is only called once. Once the listener is executed,
   * it will be removed from the registry.
   *
   * @param listener
   */
  once (listener) {
    assert ((listener instanceof Listener), 'listener is not an instance of Listener');

    this._once.push (listener);
  },

  /**
   * Emit a new event. The order the event is emitted to the registered listeners
   * is non-deterministic.
   */
  emit () {
    let args = arguments;

    let once = this._once;
    this._once = [];

    return new Promise ((resolve, reject) => {
      async.parallel ([
        (callback) => {
          async.each (this._on, (listener, callback) => {
            listener.handleEvent.apply (listener, args);
            return callback (null);
          }, callback);
        },

        (callback) => {
          async.each (once, (listener, callback) => {
            listener.handleEvent.apply (listener, args);
            return callback (null);
          }, callback);
        }
      ], done);

      function done (err) {
        if (err) return reject (err);
        return resolve (null);
      }
    });
  },

  /**
   * Remove the listener at the specified index.
   *
   * @param index
   */
  removeListenerAt (index) {
    this._on.splice (index, 1);
  }
});

