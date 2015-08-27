module.exports = exports = {
  port: 5000,

  morgan: {
    format: 'dev',
    immediate: true
  },

  session: {
    cookie: {
      secure: false
    },
    secret: '123abc',
    resave: true,
    saveUninitialized: true
  }
};