const Barrier = require ('./barrier');
const debug   = require ('debug')('blueprint:barrier');

let barriers = {};

/**
 * Factory method for registering a participant with a barrier. If the barrier
 * does not exist, then a new barrier is created.
 *
 * @param name              Name of the barrier
 * @param participant       JavaScript object
 * @returns {Barrier}
 */
function registerParticipant (name, participant) {
  let barrier = barriers[name];

  if (!barrier) {
    debug (`creating barrier ${name}`);
    barrier = barriers[name] = new Barrier ({name});
  }

  debug (`registering participant with barrier ${name}`);
  return barrier.registerParticipant (participant);
}

module.exports = exports = registerParticipant;

/**
 * Reset a single barrier.
 *
 * @param name
 */
exports.reset = function (name) {
  let barrier = barriers[name];

  if (barrier)
    barrier.reset ();
};
