const Object = require ('./object')
  , assert   = require ('assert')
  ;

/**
 * @class AbstractAction
 *
 * The AbstractAction are types returned from controller methods, and bound to router
 * paths. An subclass of AbstractAction is instantiated for each request handled. This
 * allows the subclass to store state for each request without polluting the req object
 * with stateful information that should not be available outside of the action.
 */
const AbstractAction = Object.extend ({
  /**
   * Perform the http request.
   *
   * This method has the option of return a Promise, which informs the framework
   * that completion of the request is pending.
   *
   * @returns {Promise|null}
   */
  doRequest () {
    assert (false, 'Your subclass must implement the doRequest() method, and not pass control to AbstractAction');
  }
});

module.exports = AbstractAction;
