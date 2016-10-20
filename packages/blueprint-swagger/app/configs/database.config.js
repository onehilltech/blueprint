var blueprint = require ('@onehilltech/blueprint')
  ;

module.exports = exports = {
  connstr: 'mongodb://localhost/blueprint-swagger_' + blueprint.env,

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
};
