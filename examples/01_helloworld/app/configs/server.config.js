var xpression = require ('xpression')
  ;

module.exports = exports = {
  protocols : {
    http : {
      port: 5000
    },
    https : {
      port : 5001,
      options : {
        key  : xpression.app.resource ('helloworld-key.pem'),
        cert : xpression.app.resource ('helloworld-cert.pem')
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
