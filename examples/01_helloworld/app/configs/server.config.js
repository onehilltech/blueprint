module.exports = exports = {
  protocols : {
    http : {
      port : 5000
    }
  },

  middleware : {
    bodyParser : {
      json : { },
      urlencoded : { extended: false }
    }
  }
};
