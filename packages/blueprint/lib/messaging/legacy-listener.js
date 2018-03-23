const Listener = require ('./listener')
  , assert     = require ('assert')
  ;

/**
 * @class LegacyListener
 *
 * Adapter for porting legacy listener function to Listener objects. The LegacyListener
 * object is provided for backwards compatibility support.
 *
 * The constructor takes a single function, which is mapped to the doEvent() method
 * on the Listener class.
 *
 * This object is used internally by the Blueprint framework.
 */
module.exports = Listener.extend ({
  listener: null,

  init () {
    this._super.init.apply (this, arguments);

    assert (!!this.listener, "You must define the 'listener' property");
  },

  handleEvent () {
    return this.listener.call (this.listener, ...arguments);
  }
});
