module.exports = {
  connections: {
    insecure: { protocol: 'http', port: 5000 }
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
