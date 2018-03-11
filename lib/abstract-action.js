const Object = require ('./object')
  , assert   = require ('assert')
  ;

/**
 * @class AbstractAction
 *
 * The AbstractAction are types returned from controller methods, and bound to router
 * paths.
 */
module.exports = Object.extend ({
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
