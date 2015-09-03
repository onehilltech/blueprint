var events = require ('events')
  ;

// Get the messengers for the main module. This will either be
var messengers = process.mainModule.messaging = process.mainModule.messaging || {
    '_' : new events.EventEmitter ()
  };

/**
 * Test if a Messenger object exists.
 *
 * @param key
 * @returns {Boolean}
 */
function hasMessenger (key) {
  return messengers.hadOwnProperty (key);
}

/**
 * Get an existing messenger. If the messenger does not exist, then a new one
 * is created.
 *
 * @param key
 * @returns {*}
 * @constructor
 */
exports.Messenger = function (key) {
  if (hasMessenger (key))
    return messengers[key];

  var messenger = new events.EventEmitter ();
  messengers[key] = messenger;

  return messenger;
};

exports.hasMessenger = hasMessenger;
