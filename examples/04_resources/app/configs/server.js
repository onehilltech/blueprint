module.exports = {
  protocols : {
    http : {
      port: 5000
    }
  },

  middleware : {
    bodyParser : {
      urlencoded : { extended: false },
      json : { }
    },

    morgan: {
      format: 'dev',
      immediate: true
    }
  }
};
