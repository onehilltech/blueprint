'use strict';

const objectPath = require ('object-path')
  ;

/**
 * Transform the document by removing the _stat field.
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
 * Plugin that adds stat information about the resource to each document.
 *
 * @param schema
 * @constructor
 */
function HiddenPlugin (schema) {
  // Always remove the _stat information from the document. We need to
  // preserve any existing transformation attached to the schema.
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

  // Define helper methods for accessing the stats.

  schema.methods.hidden = function () {
    return hidden;
  };
}

module.exports = HiddenPlugin;
