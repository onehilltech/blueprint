'use strict';

var events = require ('events')
  ;

const DEFAULT_KEY = '_';

/**
 * @class Messaging
 *
 * @constructor
 */
function Messaging () {
  this._messengers = {
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
  return this._messengers.hasOwnProperty (key);
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
  key = key || DEFAULT_KEY;

  if (this.hasMessenger (key))
    return this._messengers[key];

  var messenger = new events.EventEmitter ();
  this._messengers[key] = messenger;

  return messenger;
};

/**
 * Get all the messengers contained in this Messaging object.
 */
Messaging.prototype.__defineGetter__ ('messengers', function () {
  return this._messengers;
});

module.exports = exports = Messaging;
