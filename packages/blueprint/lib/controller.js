const BlueprintObject = require ('./object');
const SupportsMessaging = require ('./supports-messaging');

/**
 * @class Controller
 *
 * Base class for all controllers.
 */
module.exports = BlueprintObject.extend ({
  init () {
    this._super.init.apply (this, arguments);

    BlueprintObject.mixin (this, SupportsMessaging ('app'));
  }
});
