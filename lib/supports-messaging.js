const {get} = require ('object-path');

module.exports = function (path) {
  return {
    on (name, handler) {
      let messaging = get (this, path);

      if (messaging)
        messaging.on (name, handler);
    },

    once (name, handler) {
      let messaging = get (this, path);

      if (messaging)
        messaging.once (name, handler);
    },

    emit () {
      let messaging = get (this, path);

      if (messaging)
        messaging.emit (...arguments);
    }
  }
};
