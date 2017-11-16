'use strict';

var blueprint = require ('@onehilltech/blueprint')
  ;

module.exports = {
  connections: {
    $default: {
      connstr: 'mongodb://localhost/blueprint_cloud_messaging_' + blueprint.env,

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
