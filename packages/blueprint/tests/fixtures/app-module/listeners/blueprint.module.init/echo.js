const Listener = require ('../../../../../lib/messaging/listener');

const Base = Listener.extend ({
  handleEvent (msg) {
    console.log (msg);
  }
});

module.exports = Base.extend ({
  handleEvent (msg) {
    console.log (msg);
  }
});
