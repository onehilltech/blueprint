const BlueprintObject = require ('./object');
const RouterBuilder = require ('./router-builder');
const assert = require ('assert');

/**
 * @class Router
 */
module.exports = BlueprintObject.extend ({
  specification: null,

  init () {
    this._super.call (this, ...arguments);

    assert (!!this.specification, 'You must define the "specification" property.');
  },

  /**
   * Build the router.
   *
   * @param controllers
   * @param policies
   */
  build (controllers, policies) {
    const resources = {
      controllers,
      policies
    };

    return new RouterBuilder (resources)
      .addSpecification (this.specification)
      .build ();
  }
});
