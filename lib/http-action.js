const Object = require ('./object')
  , assert   = require ('assert')
  ;

/**
 * @class HttpAction
 *
 * The HttpAction are types returned from controller methods, and bound to router
 * paths. A HttpAction is instantiated for each request handled. This allows the
 * HttpAction to store state for each request without polluting the req object
 * with stateful information that should not be available outside of the action.
 */
const HttpAction = Object.extend ({
  /**
   * Perform the http request.
   *
   * This method is the main entry point for handling http request. The subclass must
   * implement the doExecute() method, which executes the http request.
   *
   * The req and res object are cached as member variables for access in the
   * subclass methods.
   *
   * @param req
   * @param res
   * @returns {Promise}
   */
  doRequest (req, res) {
    this.req = req;
    this.res = res;

    return Promise.resolve ().then (() => {
      return this.doValidate ();
    }).then (() => {
      return this.doSanitize ();
    }).then (() => {
      return this.doExecute ();
    });
  },

  doValidate () {
    return null;
  },

  doSanitize () {
    return null;
  },

  doExecute () {
    assert (false, 'The subclass must implement the doExecute() method.')
  }
});

module.exports = HttpAction;
