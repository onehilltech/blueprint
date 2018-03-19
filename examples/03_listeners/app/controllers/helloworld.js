const {
  Action,
  Controller,
} = require ('@onehilltech/blueprint');

module.exports = Controller.extend ({
  echoName () {
    return Action.extend ({
      execute (req, res) {
        const {name} = req.body;
        res.render ('helloworld.pug', {name});
      }
    });
  }
});
