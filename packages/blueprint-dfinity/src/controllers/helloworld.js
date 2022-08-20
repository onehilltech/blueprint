const { Controller, Action } = require ('@onehilltech/blueprint');

/**
 * @class HelloWorldController
 */
module.exports = Controller.extend ({
  echoName () {
    return Action.extend ({
      execute (req, res) {
        res.render ('helloworld.pug', {name: req.body.name});
      }
    });
  }
});
