const CoreObject = require ('../object');
const debug  = require ('debug') ('blueprint:barrier');
const BarrierParticipant = require ('./barrier-participant');

/**
 * @class Barrier
 *
 * The Barrier object synchronizes the workflow progress in the application.
 */
module.exports = CoreObject.extend ({
  name: null,

  _promise: null,

  init () {
    this._super.call (this, ...arguments);

    this._participants = {};
    this._signalled = [];

    Object.defineProperty (this, 'participantCount', {
      get () {
        return Object.keys (this._participants).length;
      }
    });

    Object.defineProperty (this, 'pendingCount', {
      get () {
        return this.participantCount - this._signalled.length;
      }
    });
  },

  reset () {
    this._signalled = [];
    this._promise = null;
    this._signal = null;
  },

  /**
   * Register a participant with the barrier.
   *
   * @param participant       Name of the participant
   * @returns {BarrierParticipant}
   */
  registerParticipant (participant) {
    if (this._participants[participant])
      throw new Error (`participant ${participant} already registered for barrier ${this.name}`);

    let bp = new BarrierParticipant ({barrier: this, name: participant});
    this._participants[participant] = bp;

    return bp;
  },

  signal (participant) {
    debug (`participant ${participant.name} signalling barrier ${this.name}`);

    // Add the callback to the waiting list.
    this._signalled.push (participant);

    const pending = this.pendingCount;
    debug (`barrier ${this.name} waiting for ${pending} signals`);

    if (!this._promise)
      this._promise = new Promise ((resolve) => this._signal = resolve);

    if (pending === 0) {
      // We are not waiting for any more participants to signal they have reached
      // the barrier. Let's notify all that the barrier is complete.
      debug (`barrier ${this.name} notifying all participants`);
      this._signal (null);
    }

    return this._promise;
  }
});
