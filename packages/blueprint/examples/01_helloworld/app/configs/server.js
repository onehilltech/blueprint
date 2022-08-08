const blueprint = require('@onehilltech/blueprint');

module.exports = {
  // using protocols is the legacy method configuring server ports
  protocols: {
    http: {
      port: 5000
    },
    https: {
      port: 5001,
      options: {
        key: blueprint.asset('ssl/helloworld.key'),
        cert: blueprint.asset('ssl/helloworld.crt')
      }
    }
  },
  connections: {
    insecure: {
      protocol: 'http',
      port: 8080
    },
    secure: {
      port: 8443,
      protocol: 'https',
      options: {
        key: blueprint.asset('ssl/helloworld.key'),
        cert: blueprint.asset('ssl/helloworld.crt')
      }
    }
  },
  middleware: {
    bodyParser: {
      json: {},
      urlencoded: {
        extended: false
      }
    }
  }
};