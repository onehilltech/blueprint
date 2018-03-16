const Listener = require ('../../../../../lib/messaging/listener');

module.exports = Listener.extend ({
  handleEvent (msg) {
    console.log (msg);
  }
});
