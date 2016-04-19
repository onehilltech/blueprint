module.exports = exports = {
  protocols: {
    http: {
      port: 5000
    }
  },

  middleware : {
    validator  : { },
    bodyParser : { json : { } },
    passport   : {  },

    morgan: {
      format: 'dev',
      immediate: true
    },

    session: {
      cookie: {
        secure: false
      },
      secret: "123abc",
      resave: true,
      saveUninitialized: true
    }
  }
};