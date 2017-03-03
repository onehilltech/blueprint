'use strict';

var objectPath = require ('object-path')
  , _          = require ('underscore')
  ;

/**
 * Schema type for a const field. The ConstSchema is a proxy for the real schema
 * type, delegating all call to the real schema except for applySetters
 * @param schema
 * @constructor
 */
function ConstSchema (schema) {
  this._schema = schema;

  var properties = ['path', 'options', 'instance', 'validators', 'getters', 'setters'];
  var _this = this;

  properties.forEach (function (name) {
    Object.defineProperty (_this, name, {set: function (val) { _this._schema[name] = val;}, get: function () { return _this._schema[name]; }});
  });
}

ConstSchema.prototype.validate = function( ) {
  return this._schema.validate.apply (this._schema, arguments);
};

ConstSchema.prototype.getDefault = function () {
  return this._schema.getDefault.apply (this._schema, arguments);
};

ConstSchema.prototype.applySetters = function (value, scope, init, priorVal, options) {
  return priorVal !== undefined ? priorVal : this._schema.applySetters.apply (this._schema, arguments);
};

ConstSchema.prototype.applyGetters = function () {
  return this._schema.applyGetters.apply (this._schema, arguments);
};

ConstSchema.prototype.doValidate = function() {
  return this._schema.doValidate.apply (this._schema, arguments);
};

ConstSchema.prototype.doValidateSync = function() {
  return this._schema.doValidateSync.apply (this._schema, arguments);
};

ConstSchema.prototype.cast = function() {
  return this._schema.cast.apply (this._schema, arguments);
};

ConstSchema.prototype.castForQuery = function() {
  return this._schema.castForQuery.apply (this._schema, arguments);
};

ConstSchema.prototype.checkRequired = function() {
  return this._schema.checkRequired.apply (this._schema, arguments);
};

/**
 * Plugin that allows you to specify what fields are marked as constant. This
 * means that the field must be set at creation time, and cannot be updated
 * in the future.
 *
 * @param schema        Mongoose schema
 * @constructor
 */
function ConstPlugin (schema) {
  var paths = [];

  schema.eachPath (function (path, typeSchema) {
    if (typeSchema.options.const) {
      // Save the path later usage.
      paths.push (path);

      // Replace the schema with a const schema.
      schema.paths[path] = new ConstSchema (typeSchema);
    }
  });

  function onUpdate () {
    // Remove all const properties from the update object.
    removeConst (this._update);

    // Remove all const properties from the $set action. If $set is
    // empty, then we need to remove its operation from the update.
    if (this._update.$set) {
      removeConst (this._update.$set);

      if (this._update.$set && _.isEmpty (this._update.$set))
        delete this._update.$set;
    }

    // Remove all const properties from the $unset action. If $unset is
    // empty, then we need to remove its operation from the update.
    if (this._update.$unset) {
      removeConst (this._update.$unset);

      if (this._update.$unset && _.isEmpty (this._update.$unset))
        delete this._update.$unset;
    }

    function removeConst (obj) {
      paths.forEach (function (path) {
        objectPath.del (obj, path);
      });
    }
  }

  // Middleware hooks for updating the document. When the document is
  // updated, we make sure to update the "updated_at" path.
  schema.pre ('findOneAndUpdate', onUpdate);
  schema.pre ('update', onUpdate);

  // Define some helper methods.

  schema.statics.const = function () {
    return paths;
  };
}

module.exports = ConstPlugin;
