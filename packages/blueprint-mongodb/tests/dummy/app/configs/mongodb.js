module.exports = {
  connections: {
    $default: {
      connstr: 'mongodb://localhost/blueprint_mongodb',
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
      connstr: 'mongodb://localhost/blueprint_mongodb',
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