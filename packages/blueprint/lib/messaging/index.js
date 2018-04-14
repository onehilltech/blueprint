const Framework = require ('./framework');
const Messenger = require ('./messenger');

function createMessageFramework (opts) {
  return new Framework (opts);
}

module.exports = exports = createMessageFramework;

exports.Listener = require ('./listener');

exports.Events = {
  /// The underlying messaging for the object.
  _events: null,

  on () {
    if (this._events)
      return this._events.on (...arguments);

    this._events = new Messenger ();
    return this._events.on (...arguments);
  },

  once () {
    if (this._events)
      return this._events.once (...arguments);

    this._events = new Messenger ();
    return this._events.once (...arguments);
  },

  emit () {
    if (this._events)
      return this._events.emit (...arguments);

    this._events = new Messenger ();
    return this._events.emit (...arguments);
  }
};
