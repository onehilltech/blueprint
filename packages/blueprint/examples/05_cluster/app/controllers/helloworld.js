const {
  Controller,
  SingleViewAction
} = require ('@onehilltech/blueprint');


module.exports = Controller.extend ({
  echoName () {
    return SingleViewAction.extend ({
      template: 'helloworld.pug',

      model (req) {
        return {name: req.body.name};
      }
    })
  }
});
