const {
  Listener
} = require('@onehilltech/blueprint');

module.exports = class extends Listener {
  handleEvent() {
    console.log('The application is initialized.');
  }

};