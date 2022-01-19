module.exports = {
  connections: {
    insecure: { protocol: 'http' }
  },

  middleware : {
    morgan: {
      format: 'dev',
      immediate: true
    }
  }
};