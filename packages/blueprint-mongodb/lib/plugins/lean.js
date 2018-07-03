const lean = require ('../utils/lean');

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
  schema.methods.lean = function () {
    return lean (this);
  };
};
