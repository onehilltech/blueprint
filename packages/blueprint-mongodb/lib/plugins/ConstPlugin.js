'use strict';

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
      paths.push (path);
      schema.paths[path] = new ConstSchema (typeSchema);
    }
  });

  function onUpdate () {
    console.log (this);
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
