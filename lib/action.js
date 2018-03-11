const CoreObject = require ('./object');

/**
 * @class Action
 *
 * The base class for all actions.
 */
module.exports = CoreObject.extend ({
  /**
   * Execute the Http request.
   *
   * The signature of this method is f(req, res);
   *
   * This method has the option of returning a Promise, which informs the framework
   * that completion of the request is pending.
   *
   * @returns {Promise|null}
   */
  execute: null
});
