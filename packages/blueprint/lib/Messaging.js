'use strict';

var async  = require ('async')
  ;

/////////////////////////////////
// class EventListener

function EventListeners (name) {
  this.name = name;
  this._on = [];
  this._once = [];
}

EventListeners.prototype.on = function (listener) {
  var index = this._on.push (listener) - 1;
  return new ListenerHandle (this, index);
};

EventListeners.prototype.once = function (listener) {
  this._once.push (listener);
};

EventListeners.prototype.emit = function () {
  var args = arguments;

  // Get the once listeners and reset the collection. We are going
  // to iterate over them.
  var once = this._once;
  this._once = [];

  async.each (this._on, function (listener) {
    listener.apply (null, args);
  });

  async.each (once, function (listener) {
    listener.apply (null, args);
  });
};

//////////////////////////////////
// class ListerHandle

function ListenerHandle (listeners, index) {
  this._listeners = listeners;
  this._index = index;
}

ListenerHandle.prototype.close = function () {
  if (this._listeners == null || this._index == null)
    return;

  // Delete the listener from the array.
  this._listeners._on.splice (this._index, 1);

  this._listeners = null;
  this._index = null;
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

Messenger.prototype.__defineGetter__ ('listeners', function () {
  return this._listeners;
});

/**
 * Get the listeners for an event.
 *
 * @param ev
 * @returns {*}
 */
Messenger.prototype.getListener = function (ev) {
  if (this._listeners.hasOwnProperty (ev)) {
    return this._listeners[ev];
  }

  var listeners = new EventListeners (ev);
  this._listeners[ev] = listeners;

  return listeners;
};

/**
 * Register a listener with the messenger.
 *
 * @returns {ListenerHandle}
 */
Messenger.prototype.on = function (ev, listener) {
  return this.getListener (ev).on (listener);
};

/**
 * Register a listener for a single invocation of an event.
 *
 * @param ev
 * @param listener
 * @returns {Emitter|*|EventEmitter}
 */
Messenger.prototype.once = function (ev, listener) {
  return this.getListener (ev).once (listener);
};

/**
 * Emit an event to the messenger. The event is sent to all registered
 * listeners in the messenger.
 */
Messenger.prototype.emit = function () {
  var args = Array.from (arguments);
  var name = args.shift ();

  var listeners = this._listeners[name];

  if (listeners)
    listeners.emit.apply (listeners, args);
};

/**
 * @class MessagingFramework
 *
 * @constructor
 */
function MessagingFramework () {
  this.reset ();
}

module.exports = MessagingFramework;

/**
 * Clear the messaging framework.
 */
MessagingFramework.prototype.reset = function () {
  this.messengers = {
    _ : new Messenger ('_')
  };
};

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

MessagingFramework.prototype.once = function (ev, listener) {
  var messenger = this.messengers['_'];
  return messenger.once (ev, listener);
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
