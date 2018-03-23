module.exports = exports = {
  protocols : {
    http : {
      port: 5000
    }
  },
  middleware : {
    morgan: {
      format: 'dev',
      immediate: true
    },

    validator  : { },

    bodyParser : {
      json : { },
      urlencoded : { extended : false}
    },

    passport   : {  },

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
