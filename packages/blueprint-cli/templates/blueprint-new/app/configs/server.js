module.exports = {
  connections : {
    insecure: { protocol: 'http', port: 8080 }
  },

  middleware : {
    validator  : { },
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
