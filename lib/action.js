const BlueprintObject = require ('./object');
const SupportsMessaging = require ('./supports-messaging');
const assert = require ('assert');

/**
 * @class Action
 *
 * The base class for all actions.
 */
module.exports = BlueprintObject.extend ({
  /**
   * Optional middleware function(s) for validating the request that triggered
   * the action.
   */
  validate: null,

  /**
   * Optional express-validator schema for validating the request that
   * trigger the action.
   */
  schema: null,

  /**
   * Execute the request.
   *
   * The signature of this method is f(req, res);
   *
   * This method has the option of returning a Promise, which informs the framework
   * that completion of the request is pending.
   *
   * @returns {Promise|null}
   */
  execute: null,

  init () {
    this._super.init.apply (this, arguments);

    BlueprintObject.mixin (this, SupportsMessaging ('controller'));
  }
});
