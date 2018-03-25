const CoreObject = require ('core-object');
const objectPath = require ('object-path');

/**
 * @class BlueprintObject
 *
 * Base class for all objects in the Blueprint framework. We use core-object instead
 * of native JavaScript classes available in ES6 because the class definition cannot
 * contain any data. This, however, does not prevent classes created from core-objects
 * from being extending by ES6 classes.
 */
module.exports = CoreObject.extend ({
  init () {
    this._super.apply (this, arguments);

    CoreObject.mixin (this, objectPath (this));
  }
});

