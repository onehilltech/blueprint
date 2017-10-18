'use strict';

module.exports = {
  connections: {
    $default: {
      connstr: 'mongodb://localhost/blueprint_mongodb_tests',

      options : {
        readPreference: "primary",
        forceServerObjectId: false,
        w: 1,
        autoReconnect: true,
        keepAlive: 1,
        poolSize: 5
      }
    }
  }
};
