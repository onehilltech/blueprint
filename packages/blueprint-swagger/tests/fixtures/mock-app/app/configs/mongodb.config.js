var blueprint = require ('@onehilltech/blueprint')
  ;

module.exports = {
  connections: {
    $default: {
      connstr: 'mongodb://localhost/mock-app_' + blueprint.env,

      options : {
        db: {
          native_parser: true,
          read_preference: "primary",
          forceServerObjectId: false,
          w: 1
        },
        server: {
          auto_reconnect: true,
          keepAlive: 1,
          poolSize: 5,
          socketOptions: {}
        }
      }
    }
  }
};
