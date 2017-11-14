const Action = require ('action');

/**
 * @class ViewAction
 *
 * A ViewAction is an action that generates a view based on the content
 * of the request it is processing.
 */
const ViewAction = Action.extend ({
  /**
   * Get the data model used to populate the template.
   *
   * @returns Promise
   */
  model () {

  },

  doRequest () {
    // Get the new and the model from the subclass.
    let viewPromise = this.view ();
    let modelPromise = this.model ();
    let promises = [viewPromise, modelPromise];

    return Promise.all (promises).then (results => {
      let [view, model] = results;

      this.res.status (200).render (view, model);
    });
  }
});

module.exports = ViewAction;
