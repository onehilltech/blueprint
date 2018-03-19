var mongoose = require ('mongoose')
  , path = require ('path')
  ;

module.exports = exports = {
  protocols : {
    http : {
      port : 5000
    }
  },

  statics : [
    path.resolve (__dirname, '../../public_html')
  ],

  middleware : {
    bodyParser : {
      json :  {}
    },

    validator: {
      customSanitizers: {
        toMongoId: function (value) {
          return new mongoose.Types.ObjectId (value);
        }
      }
    }
  }
};
