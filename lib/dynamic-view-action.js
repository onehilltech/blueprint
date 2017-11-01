const Action = require ('action');

/**
 * @class DynamicViewAction
 *
 * Get the view template for this action. We use consolidate.js to manage
 * the different needs of people. The dynamic view action can control what
 * what view is displayed, and the model for the contained view.
 */
const DynamicViewAction = Action.extend ({
  /**
   * Get the view for a specific action.
   */
  view () {

  },

  /**
   * Get the data model used to populate the template.
   */
  model () {

  },

  doRequest (req, res) {
    // Get the new and the model from the subclass.
    let view  = this.view ();
    let model = this.model ();

    res.status (200).render (view, model);

    return Promise.resolve (null);
  }
});
