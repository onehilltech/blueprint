module.exports = {
  on (name, handler) {
    this.app.messaging.on (name, handler);
  },

  once (name, handler) {
    this.app.messaging.once (name, handler);
  },

  emit () {
    this.app.messaging.emit (...arguments);
  }
};
