/*
 * Copyright (c) 2018 One Hill Technologies, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { BO, computed } = require ('base-object');
const debug  = require ('debug') ('blueprint:barrier');
const BarrierParticipant = require ('./barrier-participant');

/**
 * @class Barrier
 *
 * The Barrier object synchronizes the workflow progress in the application.
 */
module.exports = BO.extend ({
  name: null,

  _promise: null,

  participantCount: computed ({
    get () { return this._participants.size; }
  }),

  pendingCount: computed ({
    get () { return this.participantCount - this._signalled.length; }
  }),

  init () {
    this._super.call (this, ...arguments);

    this._participants = new Map ();
    this._signalled = [];
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
    if (this._participants.has (participant))
      throw new Error (`participant already registered for barrier ${this.name}`);

    let bp = new BarrierParticipant ({barrier: this, registrant: participant});
    this._participants.set (participant, bp);

    return bp;
  },

  signal (participant) {
    debug (`participant signalling barrier ${this.name}`);

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
