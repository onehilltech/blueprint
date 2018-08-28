const path = require ('path');

module.exports = {
  middleware : {
    validator  : { },
    bodyParser : { json : { } },

    morgan: {
      format: 'dev',
      immediate: true
    }
  }
};