var mongoose = require ('mongoose')
  ;

module.exports = exports = {
  protocols : {
    http : {
      port: 5000
    }
  },

  middleware : {
    validator: {
      customSanitizers: {
        toMongoId: function (value) {
          return new mongoose.Types.ObjectId (value);
        }
      }
    },

    bodyParser : {
      urlencoded : { extended: false },
      json : { }
    },

    morgan: {
      format: 'dev',
      immediate: true
    },

    // INSERT OTHER SUPPORTED MIDDLEWARE HERE; ORDER DOES NOT MATTER
  }
};
