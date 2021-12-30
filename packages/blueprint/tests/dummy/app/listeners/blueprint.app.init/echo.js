const Listener = require ('../../../../../lib/messaging/listener');

module.exports = class EchoListener extends Listener{
  handleEvent (msg) {
    console.log (msg);
  }
};
