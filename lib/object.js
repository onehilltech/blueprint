const CoreObject = require ('core-object');

/**
 * @class Object
 *
 * Base class for all Objects in the Blueprint framework. We use core-object instead
 * of native JavaScript classes available in ES6 because the class definition cannot
 * contain any data. This, however, does not prevent classes created from core-objects
 * from being extending by ES6 classes.
 */
const Object = CoreObject.extend ({});

/**
 * Base class for all objects in the Blueprint framework.
 *
 * @type {CoreObject}
 */
module.exports = Object;
