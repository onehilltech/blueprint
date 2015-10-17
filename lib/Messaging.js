'use strict';

var events = require ('events')
  ;

/**
 * @class Messaging
 *
 * @constructor
 */
function Messaging () {
  this.messengers = {
    _ : new events.EventEmitter ()
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

  var messenger = new events.EventEmitter ();
  this.messengers[key] = messenger;

  return messenger;
};

/**
 * Register for an event from the framework. The callback is registered with
 * the event on the default messenger.
 *
 * @param ev
 * @param cb
 */
Messaging.prototype.on = function (ev, cb) {
  this.messengers['_'].on (ev, cb);
};

/**
 * Emit an event over the framework.
 */
Messaging.prototype.emit = function () {
  var messenger = this.messengers['_'];
  var emit = messenger.emit;

  emit.apply (messenger, arguments);
};

module.exports = exports = Messaging;
