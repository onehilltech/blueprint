const { Service } = require ('@onehilltech/blueprint');
const { forOwn } = require ('lodash');

/**
 * @class urls
 */
module.exports = Service.extend ({
  configure () {
    const { configs: { urls = {} }} = this.app;

    forOwn (urls, (value, key) => {
      Object.defineProperty (this, key, { value });
    });
  }
});
