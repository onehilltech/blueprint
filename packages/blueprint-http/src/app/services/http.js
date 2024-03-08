const { Service } = require ('@onehilltech/blueprint');
const Server = require ('../../lib/server');

/**
 * @class HttpService
 *
 * The http service for the module.
 */
module.exports = class HttpService extends Service {
  async configure () {
    Object.defineProperty (this, 'server', { value: new Server (this.app), writable: false, configurable: false });

    const { http: config } = this.app.configs;
    await this.server.configure (config);
  }
};
