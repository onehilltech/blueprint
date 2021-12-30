const { Action, Controller } = require ('@onehilltech/blueprint');

module.exports = Controller.extend ({
  __invoke () {
    return Action.extend ({
      execute (req, res) {
        return res.status (200).json ({ message: req.body.message });
      }
    });
  }
});