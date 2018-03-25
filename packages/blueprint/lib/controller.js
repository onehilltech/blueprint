const BlueprintObject = require ('./object');
const ApplicationMessaging = require ('./application-messaging');

/**
 * @class Controller
 *
 * Base class for all controllers.
 */
module.exports = BlueprintObject.extend ({
  init () {
    this._super.init.apply (this, arguments);

    BlueprintObject.mixin (this, ApplicationMessaging);
  }
});
