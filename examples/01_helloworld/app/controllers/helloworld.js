const {
  Action,
  Controller
} = require ('@onehilltech/blueprint');

module.exports = Controller.extend ({
  echoName () {
    return Action.extend ({
      execute (req, res) {
        res.render ('helloworld.pug', {name: req.body.whoami});
      }
    });
  }
});
