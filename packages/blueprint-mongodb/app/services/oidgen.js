const { Service } = require ('@onehilltech/blueprint');
const { Types: { ObjectId } } = require ('mongoose');
const { times } = require ('lodash');

/**
 * @class oidgen
 */
module.exports = Service.extend ({
  /**
   * Generate one or more ObjectId instances.
   *
   * @param n         Number of ids to generate [default=1]
   * @returns {*}
   */
  generate (n = 1) {
    return n === 1 ? new ObjectId () : times (n, () => new ObjectId ());
  },
});
