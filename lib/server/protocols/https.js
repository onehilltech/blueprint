const Protocol = require ('../protocol');
const https = require ('https');
const _ = require ('lodash');

/**
 * @class Https
 *
 * Protocol implementation for Https.
 */
const Https = Protocol.extend ({

});

/**
 * Factory method for creating a new Https protocol.
 *
 * @param app
 * @param opts
 * @returns {*}
 */
Https.createProtocol = function (app, opts) {
  let server = https.createServer (opts, app);
  let options = _.merge ({port: 443}, opts);

  return new Https ({server, options});
};

module.exports = Https;
