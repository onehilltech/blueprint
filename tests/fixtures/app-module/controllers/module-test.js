const {Action,Controller} = require ('../../../../lib');

module.exports = Controller.extend ({
  helloWorld () {
    return Action.extend ({
      doRequest (req, res) {
        return res.status (200).send ('Hello, World!');
      }
    });
  }
});

