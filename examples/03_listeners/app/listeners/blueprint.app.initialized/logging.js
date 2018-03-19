const {
  messaging: {
    Listener
  }
} = require ('@onehilltech/blueprint');

module.exports = Listener.extend ({
  handleEvent () {
    console.log ('[listener]: the application is initialized');
  }
});
