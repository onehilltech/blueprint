'use strict';

module.exports = {
  protocols: {
    http: {
      port: 8080
    }
  },

  middleware : {
    validator  : { },
    bodyParser : { json : { } },
    passport   : {  },

    morgan: {
      format: 'dev',
      immediate: true
    }
  }
};