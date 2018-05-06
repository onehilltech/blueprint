module.exports = {
  protocols: {
    http: {
      port: 8080
    }
  },

  middleware : {
    validator  : { },
    bodyParser : { json : { } },

    morgan: {
      format: 'dev',
      immediate: true
    }
  }
};