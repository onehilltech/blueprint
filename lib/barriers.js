const Object = require ('./object');
const Barrier = require ('./barrier');

/**
 * Factory method for creating a barrier.
 *
 * @param name
 * @param participant
 *
 * @returns {*}
 */
module.exports = Object.extend ({
  init () {
    this._super (this, ...arguments);

    this._barriers = {};
  },

  add (name, participant) {
    let barrier = this._barriers[name];

    if (!barrier) {
      debug (`creating barrier ${name}`);
      barrier = this._barriers[name] = new Barrier (name);
    }

    debug (`registering participant ${participant} with barrier ${name}`);
    return barrier.registerParticipant (participant);
  },

  remove (name) {
    delete this._barriers[name];
  },

  removeAll () {
    this._barriers = {};
  },

  reset (name) {
    let barrier = this._barriers[name];

    if (name)
      barrier.reset ();
  }
});

