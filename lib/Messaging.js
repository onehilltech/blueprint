'use strict';

var async  = require ('async')
  ;

/////////////////////////////////
// class EventListener

function EventListeners (name) {
  this._name = name;
  this._on = [];
}

EventListeners.prototype.on = function (listener) {
  this._on.push (listener);
};

EventListeners.prototype.emit = function () {
  var args = arguments;

  async.each (this._on, function (listener) {
    listener.apply (null, args);
  });
};

//////////////////////////////////
// class Messenger

/**
 * Wrapper class for the events.EventEmitter class to that provides more
 * domain-specific operations.
 *
 * @param key
 * @constructor
 */
function Messenger (key) {
  if (key === undefined)
    throw new Error ('key is undefined');

  this.key = key;
  this._listeners = {};
}

/**
 * Register a listener with the messenger.
 *
 * @returns {ListenerHandle}
 */
Messenger.prototype.on = function (ev, listener) {
  var listeners;

  if (this._listeners.hasOwnProperty (ev)) {
    listeners = this._listeners[ev];
  }
  else {
    listeners = new EventListeners (ev);
    this._listeners[ev] = listeners;
  }

  listeners.on (listener);
};

Messenger.prototype.__defineGetter__ ('listeners', function () {
  return this._listeners;
});

Messenger.prototype.emit = function () {
  var args = Array.from (arguments);
  var name = args.shift ();

  var listeners = this._listeners[name];

  if (listeners)
    listeners.emit.apply (listeners, args);
};

////////////////////////////////
// class MessagingFramework

/**
 * @class MessagingFramework
 *
 * @constructor
 */
function MessagingFramework () {
  this.messengers = {
    _ : new Messenger ('_')
  };
}

/**
 * Test if the messaging service has a specified messenger.
 *
 * @param key
 * @returns {*|boolean}
 */
MessagingFramework.prototype.hasMessenger = function (key) {
  return this.messengers.hasOwnProperty (key);
};

/**
 * Get an existing messenger. If the messenger does not exist, then a new one
 * is created.
 *
 * @param key
 * @returns {*}
 * @constructor
 */
MessagingFramework.prototype.getMessenger = function (key) {
  key = key || '_';

  if (this.hasMessenger (key))
    return this.messengers[key];

  var messenger = new Messenger (key);
  this.messengers[key] = messenger;

  return messenger;
};

/**
 * Register a listener for an event on the default messenger.
 *
 * @param ev
 * @param cb
 */
MessagingFramework.prototype.on = function (ev, listener) {
  var messenger = this.messengers['_'];
  return messenger.on (ev, listener);
};

/**
 * Emit an event over the framework.
 */
MessagingFramework.prototype.emit = function () {
  var messenger = this.messengers['_'];
  var emit = messenger.emit;

  emit.apply (messenger, arguments);
};

/**
 * Relay the results of a callback as an event.
 *
 * @param ev Target event to relay callback
 * @returns {Function}
 */
MessagingFramework.prototype.relay = function (ev) {
  var self = this;

  return function () {
    var args = Array.from (arguments);
    args.unshift (ev);

    self.emit.apply (self, args);
  };
};

module.exports = exports = MessagingFramework;
