const lean = require ('../utils/lean');
const { isArray, get, set, forOwn } = require ('lodash');

/**
 * Plugin that adds lean() method to all model instances. The lean() method
 * converts the model to a plain JavaScript object. The difference between
 * the lean() method and toJSON() or toObject() is that JavaScript objects, such
 * as ObjectId, are converted to their String representation. This makes it
 * easier to compare models against their JavaScript object representation
 * encoded in an html body.
 *
 * @param schema
 * @constructor
 */
module.exports = function (schema) {
  const defaultVirtuals = [];

  forOwn (schema.virtuals, (type, key) => {
    if (type.getters)
      defaultVirtuals.push (key);
  });

  schema.methods.lean = function (options = {}) {
    let { virtuals = false } = options;
    const obj = lean (this);

    if (virtuals === false)
      return obj;

    if (virtuals === true)
      virtuals = defaultVirtuals;

    return virtuals.reduce ((obj, name) => {
      const value = get (this, name);

      if (value)
        set (obj, name, value);

      return obj;
    }, obj);
  };
};
