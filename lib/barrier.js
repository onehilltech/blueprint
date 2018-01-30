const Object = require ('./object');
const debug  = require ('debug') ('blueprint:barrier');
const async  = require ('async');
const BarrierParticipant = require ('./barrier-participant');

let barriers = {};

/**
 * @class Barrier
 *
 * The Barrier object synchronizes the workflow progress in the application.
 */
let Barrier = Object.extend ({
  name: null,

  _promise: null,

  init () {
    this._super.call (this, ...arguments);
    this._participants = {};
    this._signals = 0;
    this._waiting = [];
  },

  reset () {
    this._waiting = [];
  },

  registerParticipant (participant) {
    if (this._participants[participant])
      throw new Error (`participant ${participant} already registered for barrier ${this.name}`);

    let bp = new BarrierParticipant (this, participant);
    this._participants[participant] = bp;

    return bp;
  },

  signalAndWait (participant) {
    debug (`participant ${participant.name} signalling barrier ${this.name}`);

    // Add the callback to the waiting list.
    this._waiting.push (callback);

    const pending = this.pendingCount;
    debug (`barrier ${this.name} waiting for ${pending} signals`);

    if (!this._promise) {
      this._promise = new Promise ((resolve) => {
        this._resolve = resolve;
      });
    }

    if (pending === 0) {
      // We are not waiting for any more participants to signal they have reached
      // the barrier. Let's notify all that the barrier is complete.
      debug (`barrier ${this.name} notifying all participants`);
      this._resolve (null);
    }

    return this._promise;

  }
});

module.exports = Barrier;

Barrier.prototype.__defineGetter__ ('participantCount', function () {
  return Object.keys (this._participants).length;
});


Barrier.prototype.__defineGetter__ ('pendingCount', function () {
  return this.participantCount - this._waiting.length;
});
