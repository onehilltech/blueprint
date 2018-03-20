const {
  Controller,
  SingleViewAction
} = require ('@onehilltech/blueprint');

module.exports = Controller.extend ({
  echoName () {
    return SingleViewAction.extend ({
      template: 'helloworld.pug',

      model (req) {
        const {name} = req.body;
        return {name};
      }
    });
  }
});
