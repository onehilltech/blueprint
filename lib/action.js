const AbstractAction = require ('./abstract-action')
  , assert           = require ('assert')
  ;

/**
 * @class Action
 *
 * The Action class is an implementation of the AbstractAction class that
 * support validation, sanitization, and
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
   * @returns {Promise}
   */
  doRequest () {
    // Start with Promise.resolve since there is no guarantee that doValidate()
    // will return a promise that we can chain.

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

module.exports = Action;
