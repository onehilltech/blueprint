const registry = require ("./registry");

/**
 * @class InstanceManager
 *
 * The InstanceManager class is a utility class that manages the instances created in the
 * application. This class is a realization of the Flyweight Pattern for the GoF.
 */
class InstanceManager {
  /**
   * Constructor
   *
   * @param app             Target application
   * @param registry        Type registry
   */
  constructor (app, registry) {
    this.app = app;
    this.registry = registry;

    Object.defineProperty (this, '_instances', { value: new Map (), writable: false });
  }

  /**
   * Create a new instance.
   *
   * @param typename
   * @return {*}
   */
  createInstance (typename) {
    const instance = this._instances.get (typename);
    return instance || this._createInstance (typename);
  }

  /**
   * Lookup an instance. The instance can be instantiated if it does not exist.
   *
   * @param typename            Typename to lookup
   * @param instantiate         Instantiate if not found (optional)
   * @return {*}
   */
  lookup (typename, instantiate = true) {
    const instance = this._instances.get (typename);

    if (!!instance || !instantiate)
      return instance

    return this._createInstance (typename);
  }

  /**
   * Helper method to create a new instance of a type.
   *
   * @param typename
   * @return {*}
   * @private
   */
  _createInstance (typename) {
    const instance = this.registry.createInstance (typename, this.app);
    this._instances.set (typename, instance);

    return instance;
  }
}

module.exports = InstanceManager;
