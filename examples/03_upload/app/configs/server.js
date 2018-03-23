module.exports = {
  protocols : {
    http : {
      port: 5000
    },
  },
  middleware : {
    morgan: {
      format: 'dev',
      immediate: true
    },

    bodyParser : {
      json : { },
      urlencoded : { extended : false}
    }
  }
};
