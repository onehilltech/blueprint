const { Listener } = require ('@onehilltech/blueprint');

/**
 * @class ConsoleListener
 */
module.exports = class extends Listener {
  handleEvent () {
    console.log ('The application has started...');
  }
}
