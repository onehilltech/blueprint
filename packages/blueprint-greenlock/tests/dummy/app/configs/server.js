module.exports = {
  connections : {
    greenlock : { protocol: 'greenlock' },
  },

  middleware : {
    validator  : { },
    bodyParser : { json : { } },

    morgan: {
      format: 'dev',
      immediate: true
    }
  }
};