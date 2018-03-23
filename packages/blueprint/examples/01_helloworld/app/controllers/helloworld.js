const {
  SingleViewAction,
  Controller
} = require ('@onehilltech/blueprint');

module.exports = Controller.extend ({
  echoName () {
    return SingleViewAction.extend ({
      template: 'helloworld.pug',

      model (req) {
        const {whoami} = req.body;
        return {name: whoami};
      }
    });
  }
});
