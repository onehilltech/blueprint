/**
 * @mixin ApplicationMessaging
 *
 * Mixin for adding application messaging support to an object. The mixin
 * assumes the target object as an Application instance stored in the `app`
 * property.
 *
 * Usage:
 *
 *   BlueprintObject.mixin (target, ApplicationMessaging);
 */
module.exports = {
  on (name, handler) {
    this.app.messaging.on (name, handler);
  },

  once (name, handler) {
    this.app.messaging.once (name, handler);
  },

  emit () {
    this.app.messaging.emit (...arguments);
  }
};
