const Object = require ('../object');

/**
 * A participant in a barrier.
 */
module.exports = Object.extend ({
  /// The barrier that owns the participant.
  barrier: null,

  /// The object that registered as a participant.
  registrant: null,

  signal () {
    return this.barrier.signal (this);
  }
});
