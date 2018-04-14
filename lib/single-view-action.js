const ViewAction = require ('./view-action');
const assert = require ('assert');

/**
 * @class SingleViewAction
 *
 * Specialization of the ViewAction class that only supports a single view. Subclasses,
 * and instances of this class, must provide the template property.
 */
module.exports = ViewAction.extend ({
  init () {
    this._super.call (this, ...arguments);

    assert (!!this.template, "You must define the 'template' property.");
  },

  /// Name of the view template to render for this action.
  template: null,

  view () {
    return this.template;
  }
});
