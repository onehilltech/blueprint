const Object = require ('../object');

/**
 * A participant in a barrier.
 */
module.exports = Object.extend ({
  /// The barrier that owns the participant.
  barrier: null,

  /// The name of the barrier participant.
  name: null,

  signal () {
    return this.barrier.signal (this);
  }
});
