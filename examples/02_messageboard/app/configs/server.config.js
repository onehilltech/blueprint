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

    statics : [
      '../public_html'
    ]
  },
};
