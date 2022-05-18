const blueprint = require ('@onehilltech/blueprint');
const { PropertyDescriptor } = require ('base-object');

/**
 * @class ActorDescriptor
 *
 * The ActorDescriptor class allows Blueprint objects to define a property
 * that binds directly to an actor instance.
 */
class ActorDescriptor extends PropertyDescriptor {
  /**
   * Initializing constructor
   *
   * @param type          IDL type
   * @param options       Actor creation options
   */
  constructor (type, options = {}) {
    super ();

    this.type = type;
    this.options = options;
  }

  /**
   * @override
   */
  defineProperty (obj, name) {
    const self = this;

    Object.defineProperty (obj, name, {
      get ( ) { return self.getInstance (); }
    });
  }

  /**
   * Get the singleton instance for this property. We only need to create the instance
   * once. Afterwards, we can just us the instance we created.
   */
  getInstance () {
    if (!!this._instance)
      return this._instance;

    const dfinity = blueprint.lookup ('service:dfinity');
    this._instance = dfinity.createInstance (this.type, this.options);
    return this._instance;
  }

  /// Instantiated actors bound to the target property.
  _instance = null;
}

/**
 * Factory method that creates the actor descriptor.
 *
 * @param type          IDL type
 * @param options       Actor creation options
 */
function actor (type, options) {
  return new ActorDescriptor (type, options);
}

module.exports = actor;



