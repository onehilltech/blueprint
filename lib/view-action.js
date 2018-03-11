const Action = require ('./action');

/**
 * @class ViewAction
 *
 * A ViewAction is an action that generates a view based on the content
 * of the request it is processing.
 */
const ViewAction = Action.extend ({
  /**
   * Get the view template for the action. The view is used to render a
   * response to the caller.
   *
   * @returns Promise
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
    let vp = this.view ();
    let mp = this.model ();
    let promises = [vp, mp];

    return Promise.all (promises).then (results => {
      let [view, model] = results;

      res.status (200).render (view, model);
    });
  }
});

module.exports = ViewAction;
