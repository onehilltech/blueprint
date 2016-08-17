'use strict';

var events  = require ('events')
  , winston = require ('winston')
  ;

/**
 * The ListenerHandle is returned after a listener is registered with the Messenger. This
 * handle allows the client to quickly remove the listener without having the remember the
 * target messenger, event, or listener.
 *
 * @param emitter
 * @param ev
 * @param listener
 * @constructor
 */
function ListenerHandle (messenger, ev, listener) {
  this.messenger = messenger;
  this.ev = ev;
  this.listener = listener;
}

/**
 * Close the handle. Closing the handle will remove the listener from the
 * messenger.
 */
ListenerHandle.prototype.close = function () {
  this.messenger.emitter.removeListener (this.ev, this.listener);
  this.messenger = undefined;
};

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
  this.emitter = new events.EventEmitter ();
}

/**
 * Register a listener with the messenger.
 *
 * @returns {ListenerHandle}
 */
Messenger.prototype.on = function (ev, listener) {
  this.emitter.on (ev, listener);
  return new ListenerHandle (this, ev, listener);
};

/**
 * Register a one-time only listener with the messenger.
 *
 * @returns {ListenerHandle}
 */
Messenger.prototype.once = function (ev, listener) {
  this.emitter.once (ev, listener);
  return new ListenerHandle (this, ev, listener);
};

/**
 * Get the listener count for an event.
 *
 * @param ev
 */
Messenger.prototype.listenerCount = function (ev) {
  return events.EventEmitter.listenerCount (this.emitter, ev);
};

/**
 * Emit an event.
 */
Messenger.prototype.emit = function () {
  var emit = this.emitter.emit;
  emit.apply (this.emitter, arguments);
};

/**
 * @class Messaging
 *
 * @constructor
 */
function Messaging () {
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
Messaging.prototype.hasMessenger = function (key) {
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
Messaging.prototype.getMessenger = function (key) {
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
Messaging.prototype.on = function (ev, listener) {
  var messenger = this.messengers['_'];
  return messenger.on (ev, listener);
};

/**
 * Register a one-time only listener for an event on the default messenger.
 *
 * @param ev
 * @param cb
 */
Messaging.prototype.once = function (ev, listener) {
  var messenger = this.messengers['_'];
  return messenger.once (ev, listener);
};

/**
 * Emit an event over the framework.
 */
Messaging.prototype.emit = function () {
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
Messaging.prototype.relay = function (ev) {
  var self = this;

  return function () {
    self.emit (ev, arguments);
  };
};

module.exports = exports = Messaging;
