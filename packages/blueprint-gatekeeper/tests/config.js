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
    secret: 'abc123', 
    key: 'sid', 
    cookie: { 
      secure: false 
    }
  },

  router : {
    auth : {
      loginRoute : '/auth/login',
      logoutRoute : '/auth/logout'
    }
  }
}
