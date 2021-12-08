const {
  SingleViewAction,
  Controller,
  Action
} = require ('@onehilltech/blueprint');

module.exports = Controller.extend ({
  echoName () {
    return Action.extend ({
      execute (req, res) {

      }
    })

    return SingleViewAction.extend ({
      template: 'helloworld.pug',

      model (req) {
        const {whoami} = req.body;
        return {name: whoami};
      }
    });
  }
});
