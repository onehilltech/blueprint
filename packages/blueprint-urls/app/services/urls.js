const { Service } = require ('@onehilltech/blueprint');
const { forOwn } = require ('lodash');

/**
 * @class urls
 */
module.exports = Service.extend ({
  /**
   * Configure the service.
   */
  configure () {
    const { configs: { urls = {} }} = this.app;
    const { aliases = {} } = urls;

    forOwn (aliases, (value, key) => {
      Object.defineProperty (this, key, { value });
    });
  }
});
