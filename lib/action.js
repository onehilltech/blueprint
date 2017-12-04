const AbstractAction = require ('./abstract-action')
  , assert           = require ('assert')
  ;

/**
 * @class Action
 *
 * The Action class is an implementation of the AbstractAction class that
 * support validation, sanitizing, and execution of a request.
 */
const Action = AbstractAction.extend ({
  /**
   * Perform the http request.
   *
   * This method is the main entry point for handling http request. The subclass must
   * implement the doExecute() method, which executes the http request.
   *
   * The req and res object are cached as member variables for access in the
   * subclass methods.
   *
   * @param req           Http request object
   * @param res           Http response object
   * @returns {Promise}
   */
  doRequest (req, res) {
    // Start with Promise.resolve since there is no guarantee that doValidate()
    // will return a promise that we can chain.
    return Promise.resolve ().then (() => {
      return this.doValidate (req);
    }).then (() => {
      return this.doSanitize (req);
    }).then (() => {
      return this.doExecute (req, res);
    });
  },

  /**
   * Validate the request.
   *
   * @param req       The request object
   * @returns {Promise}
   */
  doValidate (req) {
    return null;
  },

  /**
   * Sanitize the request.
   *
   * @param req       The request object
   * @returns {Promise}
   */
  doSanitize (req) {
    return null;
  },

  /**
   * Execute the request.
   *
   * @param req       The request object
   * @param res       The response object
   * @returns {Promise}
   */
  doExecute (req, res) {
    assert (false, 'The subclass must implement the doExecute() method.')
  }
});

module.exports = Action;
