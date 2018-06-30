const moment = require ('moment');

/**
 * Transform the document by removing the _stat field.
 *
 * @param orig
 * @returns {Function}
 */
function transform (orig) {
  return function (doc, ret, options) {
    delete ret._stat;
    return orig (doc, ret, options);
  }
}

/**
 * Plugin that adds stat information about the resource to each document.
 *
 * @param schema
 * @constructor
 */
module.exports = function (schema) {
  // You cannot support soft delete and have a field marked as unique.
  const { options: { softDelete = false }} = schema;

  let fields = {
    _stat: {
      /// The time/date the resource was created.
      created_at: {type: Date, required: true, default: Date.now},

      /// The time/date the resource was modified.
      updated_at: {type: Date}
    }
  };

  // Update the scheme with the deleted_at field if the schema supports
  // soft delete. This will be used to signify a document is deleted without
  // actually deleting the document.


  if (softDelete)
    fields._stat.deleted_at = {type: Date};

  schema.add (fields);

  // By default, the _stats property is not included in the transformed document. It
  // should be included if you want to ensure updated documents have different ETags.
  if (!schema.options.toObject)
    schema.options.toObject = {};

  if (!schema.options.toJSON)
    schema.options.toJSON = {};

  if (!schema.options.toObject.stats) {
    let objTransform = schema.options.toObject.transform || function (doc, ret) { return ret; };
    schema.options.toObject.transform = transform (objTransform);
  }

  if (!schema.options.toJSON.stats) {
    let jsonTransform = schema.options.toJSON.transform || function (doc, ret) { return ret; };
    schema.options.toJSON.transform = transform (jsonTransform);
  }

  /*
   * Ensure the created_at field aways appears in the document.
   */
  schema.pre ('save', function (next) {
    // You cannot save a document if it has been marked as deleted. Throw an
    // error preventing the save from occurring.
    if (softDelete && !!this._stat.deleted_at)
      throw new Error ('You cannot save a deleted document.');

    if (this.isNew) {
      // The document is newly created. Make sure we have the created_at
      // field in the document.
      if (!this._stat.created_at)
        this._stat.created_at = new Date ();
    }
    else {
      // The document is being updated. We need to always set the updated_at
      // field to the current date/time.
      this._stat.updated_at = new Date ();
    }

    next ();
  });

  function onUpdate () {
    if (!this._update.$set)
      this._update.$set = {};

    this._update.$set['_stat.updated_at'] = new Date ();
  }

  // Middleware hooks for updating the document. When the document is
  // updated, we make sure to update the "updated_at" path.
  schema.pre ('findOneAndUpdate', onUpdate);
  schema.pre ('update', onUpdate);

  // Define helper methods for accessing the stats.

  schema.virtual ('created_at').get (function () {
    return this._stat.created_at;
  });

  schema.virtual ('updated_at').get (function () {
    return this._stat.updated_at;
  });

  schema.virtual ('deleted_at').get (function () {
    return this._stat.deleted_at;
  });

  schema.virtual ('is_deleted').get (function () {
    return !!this._stat.deleted_at;
  });

  schema.virtual ('last_modified').get (function () {
    return this._stat.updated_at || this._stat.created_at;
  });

  schema.virtual ('is_original').get (function () {
    return !this._stat.updated_at && !this._stat.deleted_at;
  });

  schema.methods.outdated = function (lastUpdateTime) {
    return this._stat.updated_at && moment (this._stat.updated_at).isAfter (lastUpdateTime);
  };
  
  // Index the fields in _stat. This will make it easier to search for documents
  // based on the corresponding timestamps.
  schema.path ('_stat.created_at').index (true);
  schema.path ('_stat.updated_at').index (true);

  if (softDelete)
    schema.path ('_stat.deleted_at').index (true);
};
