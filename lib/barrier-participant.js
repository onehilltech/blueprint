const Object = require ('./object');

module.exports = Object.extend ({
  /// The barrier that owns the participant.
  barrier: null,

  /// The name of the barrier participant.
  name: null,

  signal () {
    this.signalAndWait ();
  },

  signalAndWait () {
    return this.barrier.signalAndWait (this);
  }
});
