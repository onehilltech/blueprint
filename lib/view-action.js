const Action = require ('./action');

/**
 * @class ViewAction
 *
 * A ViewAction is an action that generates a view based on the content
 * of the request it is processing.
 */
module.exports = Action.extend ({
  /**
   * Get the view template for the action. The view is used to render a
   * response to the caller.
   *
   * @returns {String|Promise}
   */
  view () {
    throw new Error ('You must implement the view() method that promises a view template.');
  },

  /**
   * Get the data model used to populate the template.
   *
   * @returns Promise
   */
  model () {
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
