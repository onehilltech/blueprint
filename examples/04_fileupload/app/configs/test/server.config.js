module.exports = exports = {
  middleware : {
    session: {
      cookie: {
        secure: false
      },
      secret: '123abc',
      resave: true,
      saveUninitialized: true
    }
  }
};