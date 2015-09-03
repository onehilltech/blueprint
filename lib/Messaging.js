var events = require ('events')
  ;

var messengers = {
  _ : new events.EventEmitter ()
};

module.Messenger = function (key) {
  key = key || '_';
  return messengers[key];
};

module.hasMessenger = function (key) {
  return messengers.hadOwnProperty (key);
};
