const { Listener } = require ('@onehilltech/blueprint');

/**
 * @class ConsoleListener
 */
module.exports = Listener.extend ({
  handleEvent (app) {
    console.log ('The application has started...');
  }
});
