const ViewAction = require ('./action')
  ;

/**
 * @class SingleViewAction
 *
 * Specialization of the ViewAction class that only supports a single view. Subclasses,
 * and instances of this class, must provide the template property.
 */
const SingleViewAction = ViewAction.extend ({
  /// Name of the view template to render for this action.
  template: null,

  view () {
    return this.template;
  }
});

module.exports = SingleViewAction;
