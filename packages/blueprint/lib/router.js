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
   * @param resources
   */
  build (app) {
    return new RouterBuilder ({app})
      .addSpecification (this.specification)
      .build ();
  }
});
