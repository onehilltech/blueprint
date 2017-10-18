'use strict';

var blueprint = require ('@onehilltech/blueprint')
  ;

module.exports = {
  connections: {
    $default: {
      connstr: 'mongodb://localhost/gatekeeper_' + blueprint.env,

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
