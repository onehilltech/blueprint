'use strict';

const objectPath = require ('object-path')
  ;

/**
 * Transform the document by removing the hidden field.
 *
 * @param orig        Original transformation function
 * @param hidden      Fields to hide
 * @returns {Function}
 */
function transform (orig, hidden) {
  return function (doc, ret, options) {
    hidden.forEach (function (path) {
      ret = objectPath.del (ret, path);
    });

    return orig (doc, ret, options);
  }
}

/**
 * Plugin that allows you to specify what fields are hidden during transformation
 * via toObject() and toJSON(). To hide a field, add hidden=true to the field
 * definition in the model schema.
 *
 * @param schema        Mongoose schema
 * @constructor
 */
function HiddenPlugin (schema) {
  // Gather the fields to be hidden during transformation.
  var hidden = [];

  schema.eachPath (function (path, schema) {
    if (schema.options.hidden)
      hidden.push (path);
  });

  if (!schema.options.toObject)
    schema.options.toObject = {};

  if (!schema.options.toJSON)
    schema.options.toJSON = {};

  var objTransform = schema.options.toObject.transform || function (doc, ret) { return ret; };
  schema.options.toObject.transform = transform (objTransform, hidden);

  var jsonTransform = schema.options.toJSON.transform || function (doc, ret) { return ret; };
  schema.options.toJSON.transform = transform (jsonTransform, hidden);

  // Define helper methods

  schema.methods.hidden = function () {
    return hidden;
  };
}

module.exports = HiddenPlugin;
