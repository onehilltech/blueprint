module.exports = {
  connections: {
    $default: {
      uri: 'mongodb://localhost/blueprint_mongodb',
      options : {
        readPreference: "primary",
        forceServerObjectId: false,
        w: 1,
        autoReconnect: true,
        keepAlive: 1,
        poolSize: 5,
      }
    },

    secondary : {
      uri: 'mongodb://localhost/blueprint_mongodb',
      options : {
        readPreference: "primary",
        forceServerObjectId: false,
        w: 1,
        autoReconnect: true,
        keepAlive: 1,
        poolSize: 5,
      }
    }
  }
};