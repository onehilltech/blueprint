const Protocol = require ('../protocol');
const http = require ('http');
const _ = require ('lodash');

/**
 * @class Http
 *
 * Protocol implementation for Http.
 */
const Http = Protocol.extend ({

});

/**
 * Factory method for creating a new Http protocol.
 *
 * @param app
 * @param opts
 * @returns {*}
 */
Http.createProtocol = function (app, opts) {
  let server = http.createServer (app);
  let options = _.merge ({port: 80}, opts);

  return new Http ({server, options});
};

module.exports = Http;
