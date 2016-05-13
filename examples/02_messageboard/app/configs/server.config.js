module.exports = exports = {
  protocols : {
    http : {
      port : 5000
    }
  },

  middleware : {
    bodyParser : {
      json :  {}
    },

    validator: {},

    statics : [
      '../public_html'
    ]
  }
};
