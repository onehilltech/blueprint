'use strict';

var util  = require ('util')
  , async = require ('async')
  , debug = require ('debug') ('blueprint:barrier')
  ;

// Collection of known barriers.
var barriers = {};

function Barrier (name) {
  this._name = name;
  this._participants = 0;
  this._signals = 0;
  this._waiting = [];
}

Barrier.prototype.__defineGetter__ ('participantCount', function () {
  return this._participants;
});

Barrier.prototype.signalAndWait = function (callback) {
  debug ('signal barrier %s' + this._name);

  // Add the callback to the waiting list.
  this._waiting.push (callback);

  // Increment the signal count.
  ++ this._signals;

  debug (util.format ('barrier %s waiting for %d signals', this._name, (this._participants - this._signals)));

  if (this._signals === this._participants) {
    debug (util.format ('barrier %s notifying all participants', this._name));

    async.each (this._waiting, function (participant, callback) {
      // Notify the waiting application it can continue.
      participant.call (null, null);

      callback (null);
    });
  }
};

Barrier.prototype.registerParticipant = function () {
  ++ this._participants;
};

/**
 * Factory method for creating a barrier.
 *
 * @param name
 * @returns {*}
 */
function addParticipant (name) {
  var barrier = barriers[name];

  if (!barrier) {
    debug ('creating barrier ' + name);
    barrier = barriers[name] = new Barrier (name);
  }

  debug ('adding participant to barrier ' + name);
  barrier.registerParticipant ();

  return barrier;
}

module.exports = addParticipant;
