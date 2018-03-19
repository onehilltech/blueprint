const Action = require ('./action');
const assert = require ('assert');

/**
 * @class ViewAction
 *
 * A ViewAction is an action that generates a view based on the content
 * of the request it is processing.
 */
module.exports = Action.extend ({
  init () {
    this._super.call (this, ...arguments);

    assert (!!this.view, "The 'view(req)' method must be defined by the subclass.");
  },

  /**
   * Get the view template for the action. The view is used to render a
   * response to the caller.
   *
   * @params req        The request object
   * @returns {String|Promise}
   */
  view: null,

  /**
   * Get the data model used to populate the template.
   *
   * @params req        The request object
   * @returns Promise
   */
  model (req) {
    return null;
  },

  /**
   *
   * @param req       The request object
   * @param res       The response object
   * @returns {Promise}
   */
  execute (req, res) {
    // Get the new and the model from the subclass.
    let vp = this.view (req);
    let mp = this.model (req);

    return Promise.all ([vp,mp]).then (results => {
      let [view, model] = results;

      res.status (200).render (view, model);
    });
  }
});
