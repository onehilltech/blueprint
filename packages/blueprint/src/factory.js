const { isFunction } = require ('lodash');

/**
 * @class Factory
 *
 * The base class for all factory types.
 */
class Factory {
  createInstance (app) {
    throw new Error ('Your factory must implement the createInstance() method.');
  }
}

module.exports = exports = Factory;

/**
 * @class SimpleFactory
 *
 * The simple type factory will instantiate the new type in type createInstance()
 * is called.
 */
class SimpleFactory extends Factory {
  constructor (Type) {
    super ();

    this.Type = Type;
  }

  createInstance (app) {
    if (isFunction (this.Type.create))
      return this.Type.create ({ app })

    const Type = this.Type;
    return new Type (app);
  }
}

exports.SimpleFactory = SimpleFactory;

  /**
 * @class SingletonFactory
 *
 * A factory that creates only one instance of its type. After the instance is first
 * created, the same instance is returned after subsequent calls to createInstance ().
 */
class SingletonFactory extends SimpleFactory {
  singleton;

  createInstance (app) {
    if (this.singleton)
      return this.singleton;

    this.singleton = super.createInstance (app);
    return this.singleton;
  }
}

exports.SingletonFactory = SingletonFactory;

/**
 * Helper function for defining a SingletonFactory. This helper method can be used
 * if you do not need to override the default behavior of the SingletonFactory in
 * your subclass.
 */
exports.singletonFactory = function singletonFactory (Type) {
  return class SingletonFactory extends SimpleFactory {
    constructor () {
      super (Type);
    }

    /// The singleton instance.
    singleton;

    createInstance (app) {
      if (this.singleton)
        return this.singleton;

      this.singleton = super.createInstance (app);
      return this.singleton;
    }
  }
};
