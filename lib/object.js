const CoreObject = require ('core-object');
const objectPath = require ('object-path');
const assert = require ('assert');
const Mixin = require ('./mixin');

const {
  isObjectLike
} = require ('lodash');

/**
 * @class BlueprintObject
 *
 * Base class for all objects in the Blueprint framework. We use core-object instead
 * of native JavaScript classes available in ES6 because the class definition cannot
 * contain any data. This, however, does not prevent classes created from core-objects
 * from being extending by ES6 classes.
 */
class BlueprintObject extends CoreObject {
  constructor () {
    super (...arguments);

    CoreObject.mixin (this, objectPath (this));
  }

  /**
   * Specialize the extend() method to support mixins. Our extend is therefore acting
   * like a proxy to the CoreObject extend.
   */
  static extend (...args) {
    // The last argument are the properties for extending the base class. All
    // other arguments before the last argument are considered Mixins.
    const length = args.length;
    const lastArg = length > 0 ? args[length - 1] : undefined;
    const properties = lastArg && !(lastArg instanceof Mixin) ? lastArg : undefined;

    assert (properties === undefined || isObjectLike (properties), 'The last argument must be a hash.');

    if (properties)
      args.pop ();

    for (let i = 0, len = args.length; i < len; ++ i)
      assert (args[i] instanceof Mixin, `Argument ${i} is not an instance of Mixin.`);

    let Class = CoreObject.extend (properties);

    if (args.length > 0)
      args.forEach (mixin => applyMixin (Class.prototype, mixin));

    return Class;
  }
}

function applyMixin (target, mixin) {
  if (mixin.mixins && mixin.mixins.length > 0)
    mixin.mixins.forEach (mixin => applyMixin (target, mixin));

  if (mixin.properties)
    CoreObject.mixin (target, mixin.properties);
}

module.exports = BlueprintObject;
