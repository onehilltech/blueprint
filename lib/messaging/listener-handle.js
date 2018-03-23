const Object = require ('../object');
const assert = require ('assert');

/**
 * @class ListenerHandle
 *
 * Handle to a registered listener. The handle allows you to remove a listener
 * from the registry.
 */
module.exports = Object.extend ({
  init () {
    this._super.call (this, ...arguments);

    assert (!!this.listeners, 'The listeners parameter is required');
    assert (this.index !== undefined && this.index !== null, 'The index of the listener is required');
  },

  /**
   * Close the listener.
   */
  close () {
    if (this.listeners === null)
      return;

    this.listeners.removeListenerAt (this.index);
    this.listeners = null;
  }
});
