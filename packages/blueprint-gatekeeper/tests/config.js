module.exports = exports =  {
  connstr : 'mongodb://localhost/gatekeeper-test',
  port : 5000,
  
  mongodb : {
    db : {
      native_parser : true
    },

    server : {
      auto_reconnect : true,
      keepAlive : 1,
      poolSize : 5
    }
  },

  morgan : { 
    format : 'dev', 
    immediate : true 
  },

  session : {
    cookie: {
      secure: false
    },

    secret : '123abc',
    resave : true,
    saveUninitialized: true
  },

  router : {
    auth : {
      loginRoute : '/oauth2/login',
      logoutRoute : '/oauth2/logout'
    }
  }
}
