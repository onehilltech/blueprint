const ViewAction = require ('./view-action');
const assert = require ('assert');

/**
 * @class SingleViewAction
 *
 * Specialization of the ViewAction class that only supports a single view. Subclasses,
 * and instances of this class, must provide the template property.
 */
module.exports = class SingleViewAction extends ViewAction {
  constructor () {
    super (...arguments)

    assert (!!this.template, `You must define the 'template' property.`);
  }

  /// Name of the view template to render for this action.
  template = null;

  /**
   * @override
   */
  async view (req) {
    return this.template;
  }
};

