const { Listener } = require ('@onehilltech/blueprint');

module.exports = Listener.extend ({
  handleEvent () {
    console.log ('The application is initialized.')
  }
});
