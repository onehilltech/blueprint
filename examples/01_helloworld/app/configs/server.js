const blueprint = require ('@onehilltech/blueprint');

module.exports = {
  protocols : {
    http : {
      port: 5000
    },
    https : {
      port : 5001,
      options : {
        key  : blueprint.app.resource ('ssl/helloworld.key'),
        cert : blueprint.app.resource ('ssl/helloworld.crt')
      }
    }
  },

  middleware : {
    bodyParser : {
      json : { },
      urlencoded : { extended: false }
    }
  }
};
