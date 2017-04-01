'use strict';

var util  = require ('util')
  , async = require ('async')
  , debug = require ('debug') ('blueprint:barrier')
  ;

// Collection of known barriers.
var barriers = {};

function BarrierParticipant (barrier, name) {
  this._barrier = barrier;
  this._name = name;
}

BarrierParticipant.prototype.__defineGetter__ ('barrier', function () {
  return this._barrier;
});

BarrierParticipant.prototype.__defineGetter__ ('name', function () {
  return this._name;
});

BarrierParticipant.prototype.signal = function () {
  this.signalAndWait (function () {});
};

BarrierParticipant.prototype.signalAndWait = function (callback) {
  this._barrier._signalAndWait (this, callback);
};

Barrier.prototype._signalAndWait = function (participant, callback) {
  debug ('participant ' + participant.name + ' signalling barrier ' + this._name);

  // Add the callback to the waiting list.
  this._waiting.push (callback);

  const pending = this.pendingCount;
  debug (util.format ('barrier %s waiting for %d signals', this._name, pending));

  if (pending === 0) {
    debug (util.format ('barrier %s notifying all participants', this._name));

    async.each (this._waiting, function (participant, callback) {
      // Notify the waiting application it can continue.
      participant.call (null, null);

      callback (null);
    });
  }
};

Barrier.prototype.__defineGetter__ ('pendingCount', function () {
  return this.participantCount - this._waiting.length;
});

function Barrier (name) {
  this._name = name;
  this._participants = {};
  this._signals = 0;
  this._waiting = [];
}

Barrier.prototype.__defineGetter__ ('participantCount', function () {
  return Object.keys (this._participants).length;
});

Barrier.prototype.__defineGetter__ ('name', function () {
  return this._name;
});

Barrier.prototype.registerParticipant = function (participant) {
  if (this._participants[participant])
    throw new Error ('participant ' + participant + ' already registered for barrier ' + this._name);

  var bp = new BarrierParticipant (this, participant);
  this._participants[participant] = bp;

  return bp;
};

/**
 * Factory method for creating a barrier.
 *
 * @param name
 * @param participant
 *
 * @returns {*}
 */
function addParticipant (name, participant) {
  var barrier = barriers[name];

  if (!barrier) {
    debug ('creating barrier ' + name);
    barrier = barriers[name] = new Barrier (name);
  }

  debug ('registering participant ' + participant + ' with barrier ' + name);
  return barrier.registerParticipant (participant);
}

function removeAll () {
  barriers = {};
}

var exports = module.exports = addParticipant;
exports.removeAll = removeAll;
