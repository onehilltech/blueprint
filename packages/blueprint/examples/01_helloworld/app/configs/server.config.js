var blueprint = require ('blueprint')
  ;

module.exports = exports = {
  protocols : {
    http : {
      port: 5000
    },
    https : {
      port : 5001,
      options : {
        key  : blueprint.app.resource ('helloworld-key.pem'),
        cert : blueprint.app.resource ('helloworld-cert.pem')
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
